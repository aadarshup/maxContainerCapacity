def pack_boxes(container, box_plan, box_definitions):
    container_w = container['width']
    container_d = container['depth']
    container_h = container['height']

    # Load all requested boxes
    box_lookup = {b['id']: b for b in box_definitions}
    boxes = []

    for plan in box_plan:
        btype = box_lookup.get(plan['id'])
        if not btype:
            continue
        for _ in range(plan['quantity']):
            boxes.append(dict(btype))

    # Sort boxes by volume (or base area) descending
    boxes.sort(key=lambda b: b['width'] * b['depth'] * b['height'], reverse=True)

    # Initialize 3D grid: [width][depth] => list of (start_z, height)
    grid = [[[] for _ in range(container_d)] for _ in range(container_w)]

    placements = []

    def can_place(x, y, w, d, h):
        if x + w > container_w or y + d > container_d:
            return False

        max_z = 0
        for i in range(x, x + w):
            for j in range(y, y + d):
                if grid[i][j]:
                    top = sum(height for _, height in grid[i][j])
                else:
                    top = 0
                if top + h > container_h:
                    return False
                max_z = max(max_z, top)
        return max_z

    def place_box(x, y, w, d, h, z):
        for i in range(x, x + w):
            for j in range(y, y + d):
                grid[i][j].append((z, h))

    for box in boxes:
        placed = False
        for i in range(container_w):
            for j in range(container_d):
                if i + box['width'] > container_w or j + box['depth'] > container_d:
                    continue
                z = can_place(i, j, box['width'], box['depth'], box['height'])
                if z is not False:
                    place_box(i, j, box['width'], box['depth'], box['height'], z)
                    placements.append({
                        'id': box['id'],
                        'x': i,
                        'y': j,
                        'z': z,
                        'w': box['width'],
                        'd': box['depth'],
                        'h': box['height']
                    })
                    placed = True
                    break
            if placed:
                break

    return {
        'placed_boxes': placements,
        'count': len(placements)
    }

'''
def pack_boxes(container, box_plan, box_definitions):
    container_w = container['width']
    container_d = container['depth']
    container_h = container['height']

    # 1. Create flat list of boxes from box_plan
    box_lookup = {b['id']: b for b in box_definitions}
    boxes = []

    for plan in box_plan:
        btype = box_lookup.get(plan['id'])
        # if not btype or btype['height'] != container_h:
        #     print('hi1')
        #     continue  # skip if height doesn't match
        for _ in range(plan['quantity']):
            print('hi2')
            boxes.append({ **btype })  # copy box

    # 2. Sort boxes by area descending (best-fit)
    boxes.sort(key=lambda b: b['width'] * b['depth'], reverse=True)
    print(boxes)

    # 3. 2D grid for placement
    grid = [[0] * container_d for _ in range(container_w)]
    placements = []

    def can_place(x, y, w, d):
        if x + w > container_w or y + d > container_d:
            return False
        return all(grid[i][j] == 0 for i in range(x, x + w) for j in range(y, y + d))

    def place_box(x, y, w, d):
        for i in range(x, x + w):
            for j in range(y, y + d):
                grid[i][j] = 1

    for box in boxes:
        placed = False
        for i in range(container_w):
            for j in range(container_d):
                if can_place(i, j, box['width'], box['depth']):
                    place_box(i, j, box['width'], box['depth'])
                    placements.append({
                        'id': box['id'],
                        'x': i,
                        'y': j,
                        'z': 0,
                        'w': box['width'],
                        'd': box['depth'],
                        'h': box['height']
                    })
                    placed = True
                    break
            if placed:
                break

    return {
        'placed_boxes': placements,
        'count': len(placements)
    }
'''