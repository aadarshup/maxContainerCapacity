from flask import Flask, request, jsonify, render_template
import json
from utils.packing import pack_boxes

app = Flask(__name__)

BOX_DATA_FILE = 'box_data.json'

def load_boxes():
    try:
        with open(BOX_DATA_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_boxes(data):
    with open(BOX_DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/boxes', methods=['GET', 'POST', 'PUT', 'DELETE'])
def boxes():
    data = load_boxes()
    
    if request.method == 'POST':
        new_box = request.json
        data.append(new_box)
        save_boxes(data)
        return jsonify({'status': 'added', 'boxes': data})
    
    elif request.method == 'PUT':
        updated_box = request.json
        for i, box in enumerate(data):
            if box['id'] == updated_box['id']:
                data[i] = updated_box
        save_boxes(data)
        return jsonify({'status': 'updated', 'boxes': data})
    
    elif request.method == 'DELETE':
        box_id = request.args.get('id')
        data = [b for b in data if b['id'] != box_id]
        save_boxes(data)
        return jsonify({'status': 'deleted', 'boxes': data})
    
    return jsonify(data)

@app.route('/pack', methods=['POST'])
def pack():
    container = request.json['container']
    plan = request.json['box_plan']
    all_box_types = load_boxes()  # from your JSON file
    print(container,plan,all_box_types)

    result = pack_boxes(container, plan, all_box_types)
    print(result)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
