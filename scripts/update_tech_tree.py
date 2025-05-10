#!/usr/bin/env python3
import xml.etree.ElementTree as ET
import json
import re
from collections import defaultdict

SCALE_X = 2.2


def extract_tech_tree(file_path: str):
    # Parse the XML
    tree = ET.parse(file_path)
    root = tree.getroot()

    # Find the mxGraphModel element
    model = root.find(".//mxGraphModel")
    if model is None:
        raise ValueError("Could not find mxGraphModel element")

    # Find the root cell
    root_cell = model.find("./root")
    if root_cell is None:
        raise ValueError("Could not find root element")

    # Dictionaries to store data
    blocks = []
    blocks_by_name = {}
    cell_id_to_name = {}
    cell_id_to_geometry = {}

    # Extract blocks (cells with rounded=1 and no edge style)
    for cell in root_cell.findall("./mxCell"):
        style = cell.get("style", "")
        if (
            "edgeStyle" not in style
            and "rounded=1" in style
            and cell.get("value") is not None
        ):
            # This is a block
            cell_id = cell.get("id")

            # Extract name (remove HTML tags and encoded content)
            name = cell.get("value")
            # Remove HTML tags
            name = re.sub(r"<.*?>", "", name)
            # Remove encoded content (anything after %)
            name = re.sub(r"%.*$", "", name)
            name = name.strip()

            # Find geometry
            geometry = cell.find("./mxGeometry")
            if geometry is not None:
                x = float(geometry.get("x", 0))
                y = float(geometry.get("y", 0))
                width = float(geometry.get("width", 0))

                # Store block information
                blocks.append(
                    {
                        "name": name,
                        "layout": {
                            "x": x,
                            "y": y,
                            "linksMiddlePoint": [],
                        },
                    }
                )
                blocks_by_name[name] = blocks[-1]

                # Store mapping for links
                cell_id_to_name[cell_id] = name
                cell_id_to_geometry[cell_id] = (x, y, width)

    # Extract links (cells with edgeStyle)
    for cell in root_cell.findall("./mxCell"):
        style = cell.get("style", "")
        if "edgeStyle" in style:
            source_id = cell.get("source")
            target_id = cell.get("target")

            if source_id in cell_id_to_name and target_id in cell_id_to_name:
                source_name = cell_id_to_name[source_id]
                target_name = cell_id_to_name[target_id]

                # Check if there are specific points defined in the path
                mid_point = None
                array_points = cell.find('.//Array[@as="points"]')
                if array_points is not None:
                    # Use the first point's x coordinate as the midpoint
                    points = array_points.findall("./mxPoint")
                    if points:
                        source_x = cell_id_to_geometry[source_id][0]
                        target_x = cell_id_to_geometry[target_id][0]
                        source_width = cell_id_to_geometry[source_id][2]
                        original_mid_point = (source_x + source_width + target_x) / 2
                        mid_point = float(points[0].get("x", 0))
                        mid_point = mid_point - original_mid_point

                # If no array points, calculate the midpoint
                if mid_point is None:
                    mid_point = 0

                layout = blocks_by_name[source_name]["layout"]
                layout["linksMiddlePoint"].append(
                    {
                        "tech": target_name,
                        "point": mid_point * SCALE_X,
                    }
                )

    return blocks


def update_techs_file(diagram_techs: list[dict], techs_file_path: str):
    with open(techs_file_path, "r") as f:
        techs_content = f.read()

    techs_data = json.loads(techs_content)
    techs = techs_data["items"]

    diagram_names = set([tech["name"] for tech in diagram_techs])
    code_names = set([tech["name"] for tech in techs])
    mismatches = (diagram_names | code_names) - (diagram_names & code_names)

    if mismatches:
        raise ValueError(
            f"Tech names in the diagram and the techs.ts file do not match: {mismatches}"
        )

    diagram_tech_map = {tech["name"]: tech for tech in diagram_techs}

    name_to_id = {tech["name"]: tech["id"] for tech in techs}

    required_techs = defaultdict(list)
    for tech in diagram_techs:
        for link in tech["layout"]["linksMiddlePoint"]:
            required_techs[link["tech"]].append(name_to_id[tech["name"]])

    for tech in techs:
        diagram_tech = diagram_tech_map[tech["name"]]
        tech["requiredTechnologies"] = required_techs[tech["name"]]
        tech["layout"] = {
            "x": (diagram_tech["layout"]["x"]) * SCALE_X + 50,
            "y": (diagram_tech["layout"]["y"]) * SCALE_X,
            "linksMiddlePoint": [
                {"tech": name_to_id[link["tech"]], "point": link["point"] * SCALE_X}
                for link in diagram_tech["layout"]["linksMiddlePoint"]
            ],
        }

    with open(techs_file_path, "w") as f:
        f.write(json.dumps(techs_data, indent=2))

    print(f"Successfully updated the layout in {techs_file_path}")


if __name__ == "__main__":
    drawio_file = "diagrams/tech-tree.drawio"
    techs_file = "src/data/techs.json"

    print(f"Extracting tech tree from {drawio_file}...")
    techs = extract_tech_tree(drawio_file)

    print(f"Found {len(techs)} technologies in the diagram.")

    print(f"Updating {techs_file} with layout information...")
    update_techs_file(techs, techs_file)

    print("Done!")
