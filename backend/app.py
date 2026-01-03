from flask import Flask, jsonify, send_file, request
from flask_cors import CORS
import os
import json
import pandas as pd
from neo4j_client import Neo4jClient
from algorithms.disassembly_optimizer import DisassemblyOptimizer

app = Flask(__name__)
CORS(app)

# Initialize Neo4j client (optional - will use CSV if not available)
try:
    neo4j_client = Neo4jClient()
except Exception as e:
    print(f"Warning: Neo4j not available: {e}. Will use CSV files instead.")
    neo4j_client = None

optimizer = DisassemblyOptimizer()

# Data directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GLTF_DIR = os.path.join(BASE_DIR, 'data', 'gltf')
METADATA_DIR = os.path.join(BASE_DIR, 'data', 'metadata')
CSV_DIR = os.path.join(BASE_DIR, 'data', 'csv')

# Ensure directories exist
for directory in [GLTF_DIR, METADATA_DIR, CSV_DIR]:
    os.makedirs(directory, exist_ok=True)


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Disassembly Optimizer API is running'})


@app.route('/api/products', methods=['GET'])
def get_products():
    """Get list of available products"""
    products = []
    try:
        if os.path.exists(METADATA_DIR):
            for filename in os.listdir(METADATA_DIR):
                if filename.endswith('_metadata.json'):
                    product_name = filename.replace('_metadata.json', '')
                    products.append({
                        'id': product_name,
                        'name': product_name.capitalize()
                    })
    except OSError as e:
        print(f"Error reading metadata directory: {e}")
    return jsonify(products)


@app.route('/api/products/<product_id>/metadata', methods=['GET'])
def get_product_metadata(product_id):
    """Get metadata for a specific product"""
    metadata_path = os.path.join(METADATA_DIR, f'{product_id}_metadata.json')
    if os.path.exists(metadata_path):
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)

        # Transform components to have id and name fields for frontend compatibility
        if isinstance(metadata, dict) and 'components' in metadata:
            transformed_components = []
            for comp in metadata['components']:
                # Handle different metadata formats
                component_id = comp.get('component') or comp.get(
                    'id') or comp.get('name')
                component_name = comp.get('component') or comp.get(
                    'name') or comp.get('id')

                transformed_comp = {
                    'id': component_id,
                    'name': component_name,
                    **comp  # Keep all original fields
                }
                transformed_components.append(transformed_comp)

            metadata['components'] = transformed_components
        elif isinstance(metadata, list):
            # If metadata is a list of components
            metadata = {
                'components': [
                    {
                        'id': comp.get('component') or comp.get('id') or comp.get('name'),
                        'name': comp.get('component') or comp.get('name') or comp.get('id'),
                        **comp
                    }
                    for comp in metadata
                ]
            }

        return jsonify(metadata)
    return jsonify({'error': 'Product not found'}), 404


@app.route('/api/products/<product_id>/model', methods=['GET'])
def get_product_model(product_id):
    """Serve GLTF/GLB model file"""
    # Try .gltf first, then .glb
    gltf_path = os.path.join(GLTF_DIR, f'{product_id}.gltf')
    glb_path = os.path.join(GLTF_DIR, f'{product_id}.glb')

    if os.path.exists(gltf_path):
        return send_file(gltf_path, mimetype='model/gltf+json')
    elif os.path.exists(glb_path):
        return send_file(glb_path, mimetype='model/gltf-binary')
    return jsonify({'error': 'Model not found'}), 404


@app.route('/api/products/<product_id>/model/<filename>', methods=['GET'])
def get_product_model_binary(product_id, filename):
    """Serve GLTF binary files (.bin)"""
    binary_path = os.path.join(GLTF_DIR, filename)
    if os.path.exists(binary_path):
        return send_file(binary_path, mimetype='application/octet-stream')
    return jsonify({'error': 'Binary file not found'}), 404


@app.route('/api/products/<product_id>/graph', methods=['GET'])
def get_product_graph(product_id):
    """Get knowledge graph data for a product"""
    # Try to get from Neo4j first (if available)
    if neo4j_client:
        try:
            graph_data = neo4j_client.get_product_graph(product_id)
            if graph_data:
                return jsonify(graph_data)
        except Exception as e:
            print(f"Neo4j error: {e}")

    # Fallback to CSV file
    csv_path = os.path.join(CSV_DIR, f'{product_id}_graph.csv')
    if os.path.exists(csv_path):
        try:
            df = pd.read_csv(csv_path)
        except Exception as e:
            print(f"Error reading CSV file {csv_path}: {e}")
            return jsonify({'error': f'Error reading CSV file: {str(e)}'}), 500

        # Ensure 'from' and 'to' columns exist
        if 'from' not in df.columns or 'to' not in df.columns:
            return jsonify({'error': 'CSV must have "from" and "to" columns'}), 400

        # Clean the data
        df['from'] = df['from'].astype(str).str.strip()
        df['to'] = df['to'].astype(str).str.strip()

        # Get all unique nodes
        all_nodes = set(df['from'].unique()) | set(df['to'].unique())

        # Build graph data structure
        nodes = [{'id': node, 'label': node} for node in all_nodes]
        edges = []

        for _, row in df.iterrows():
            edge = {
                'source': row['from'],
                'target': row['to'],
                'type': 'disassembles_to'
            }
            # Add additional properties if they exist in CSV
            if 'safety_risk' in df.columns:
                edge['safety_risk'] = row.get('safety_risk', '')
            if 'fastener' in df.columns:
                edge['fastener'] = row.get('fastener', '')
            if 'tool' in df.columns:
                edge['tool'] = row.get('tool', '')
            if 'fastener_count' in df.columns:
                edge['fastener_count'] = row.get('fastener_count', 0)

            edges.append(edge)

        graph_data = {
            'nodes': nodes,
            'edges': edges,
            'csv_data': df.to_dict('records')  # Include raw CSV for algorithm
        }

        return jsonify(graph_data)

    return jsonify({'error': 'Graph data not found'}), 404


@app.route('/api/products/<product_id>/optimize', methods=['POST'])
def optimize_disassembly(product_id):
    """Optimize disassembly path for selected parts - matches ALGORITHMS file exactly"""
    data = request.json
    target_parts = data.get('target_parts', [])
    parameters = data.get('parameters', {})
    component_properties = data.get('component_properties', {})  # Edge-based for kettle, component-based for gearbox

    try:
        # Validate input
        if not target_parts or len(target_parts) == 0:
            return jsonify({'error': 'No target parts specified'}), 400

        # Get graph data - prefer CSV for algorithm compatibility
        csv_path = os.path.join(CSV_DIR, f'{product_id}_graph.csv')
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            # Clean data
            df['from'] = df['from'].astype(str).str.strip()
            df['to'] = df['to'].astype(str).str.strip()
            graph_data = {
                'csv_data': df.to_dict('records'),
                'nodes': [],
                'edges': []
            }
        else:
            # Fallback to Neo4j
            if neo4j_client:
                graph_data = neo4j_client.get_product_graph(product_id)
            else:
                graph_data = None

            if not graph_data:
                return jsonify({'error': 'No graph data found'}), 404

        # Run optimization algorithm
        result = optimizer.optimize(
            product_id=product_id,
            graph_data=graph_data,
            target_parts=target_parts,
            parameters=parameters,
            component_properties=component_properties
        )

        return jsonify(result)
    except ValueError as e:
        # User input errors
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Optimization error: {error_trace}")
        return jsonify({'error': str(e), 'trace': error_trace}), 500


@app.route('/api/products/<product_id>/parts', methods=['GET'])
def get_product_parts(product_id):
    """Get list of parts for a product"""
    metadata_path = os.path.join(METADATA_DIR, f'{product_id}_metadata.json')
    if os.path.exists(metadata_path):
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
            parts = metadata.get('components', [])
            return jsonify(parts)
    return jsonify({'error': 'Product not found'}), 404


if __name__ == '__main__':
    port = int(os.environ.get('PORT', os.environ.get('FLASK_PORT', 5000)))
    app.run(host='0.0.0.0', port=port, debug=False)
