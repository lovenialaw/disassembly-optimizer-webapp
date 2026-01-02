# Data Directory

This directory contains all data files for the disassembly optimization system.

## Directory Structure

```
data/
├── gltf/          # GLTF 3D model files from Blender
├── metadata/      # Metadata JSON files with component information
└── csv/           # CSV files exported from Neo4j
```

## Files to Import

### GLTF Files (data/gltf/)
Place your GLTF model files here:
- `kettle.gltf` and `kettle.bin` (if using external binary)
- `gearbox.gltf` and `gearbox.bin` (if using external binary)

### Metadata Files (data/metadata/)
Create JSON files with the following structure:

**kettle_metadata.json:**
```json
{
  "product_id": "kettle",
  "name": "Kettle",
  "components": [
    {
      "id": "body",
      "name": "Body",
      "type": "main_component"
    },
    {
      "id": "handle",
      "name": "Handle",
      "type": "attachment"
    },
    {
      "id": "lid",
      "name": "Lid",
      "type": "cover"
    }
  ],
  "properties": {
    "material": "stainless_steel",
    "weight": 1.2
  }
}
```

**gearbox_metadata.json:**
```json
{
  "product_id": "gearbox",
  "name": "Gearbox",
  "components": [
    {
      "id": "housing",
      "name": "Housing",
      "type": "main_component"
    },
    {
      "id": "gear_1",
      "name": "Gear 1",
      "type": "gear"
    }
  ],
  "properties": {
    "material": "aluminum",
    "weight": 5.8
  }
}
```

### CSV Files (data/csv/)
Export your Neo4j graph data as CSV files. The CSV should contain relationship data.

**Example structure:**
- `kettle_graph.csv` - Contains nodes and edges for kettle product
- `gearbox_graph.csv` - Contains nodes and edges for gearbox product

The CSV format should include columns for:
- Source node
- Target node
- Relationship type
- Any additional properties (time, cost, difficulty, etc.)

