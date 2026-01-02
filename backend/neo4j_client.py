from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

load_dotenv()

class Neo4jClient:
    def __init__(self):
        self.uri = os.getenv('NEO4J_URI', 'bolt://localhost:7687')
        self.user = os.getenv('NEO4J_USER', 'neo4j')
        self.password = os.getenv('NEO4J_PASSWORD', '')
        self.driver = None
        # Only try to connect if password is provided
        if self.password:
            self.connect()
        else:
            print("Neo4j not configured (no password). Will use CSV files instead.")
    
    def connect(self):
        """Establish connection to Neo4j database"""
        try:
            self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
            # Verify connection
            with self.driver.session() as session:
                session.run("RETURN 1")
            print("Connected to Neo4j successfully")
        except Exception as e:
            print(f"Neo4j connection failed: {e}")
            print("Will use CSV files instead.")
            self.driver = None
    
    def close(self):
        """Close Neo4j connection"""
        if self.driver:
            self.driver.close()
    
    def get_product_graph(self, product_id):
        """Get knowledge graph data for a product"""
        if not self.driver:
            return None
        
        query = """
        MATCH (p:Part {product: $product_id})
        OPTIONAL MATCH (p)-[r:CONNECTED_TO|DISASSEMBLES_TO|REQUIRES]-(related:Part)
        RETURN p, r, related
        """
        
        try:
            with self.driver.session() as session:
                result = session.run(query, product_id=product_id)
                
                nodes = []
                edges = []
                node_ids = set()
                
                for record in result:
                    # Process nodes
                    if record['p']:
                        node_id = record['p'].id
                        if node_id not in node_ids:
                            nodes.append({
                                'id': str(node_id),
                                'label': record['p'].get('name', ''),
                                'properties': dict(record['p'])
                            })
                            node_ids.add(node_id)
                    
                    if record['related']:
                        related_id = record['related'].id
                        if related_id not in node_ids:
                            nodes.append({
                                'id': str(related_id),
                                'label': record['related'].get('name', ''),
                                'properties': dict(record['related'])
                            })
                            node_ids.add(related_id)
                    
                    # Process edges
                    if record['r']:
                        edges.append({
                            'source': str(record['p'].id),
                            'target': str(record['related'].id),
                            'type': record['r'].type,
                            'properties': dict(record['r'])
                        })
                
                return {
                    'nodes': nodes,
                    'edges': edges
                }
        except Exception as e:
            print(f"Error querying Neo4j: {e}")
            return None
    
    def get_disassembly_paths(self, product_id, target_part):
        """Get all possible disassembly paths to a target part"""
        if not self.driver:
            return None
        
        query = """
        MATCH path = (start:Part {product: $product_id, is_root: true})-[*]->(target:Part {name: $target_part})
        RETURN path
        ORDER BY length(path)
        LIMIT 10
        """
        
        try:
            with self.driver.session() as session:
                result = session.run(query, product_id=product_id, target_part=target_part)
                paths = []
                for record in result:
                    path = record['path']
                    path_nodes = [{'id': str(node.id), 'name': node.get('name', '')} 
                                 for node in path.nodes]
                    paths.append(path_nodes)
                return paths
        except Exception as e:
            print(f"Error querying disassembly paths: {e}")
            return None

