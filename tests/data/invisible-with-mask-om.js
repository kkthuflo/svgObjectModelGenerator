{
	"global": {
		"viewBox": {
			"left": 0,
			"right": 400,
			"top": 0,
			"bottom": 500
		},
		"masks": {
			"mask1": {
				"children": [
					{
						"id": "shape-3",
						"type": "shape",
						"style": {
							"fill": {
								"type": "solid",
								"color": {
									"r": 0,
									"g": 113.686632,
									"b": 187.776986,
									"a": 1
								}
							}
						},
						"children": [],
						"title": "Rectangle 1",
						"visualBounds": {
							"top": 67,
							"left": 130,
							"bottom": 245,
							"right": 309
						},
						"shape": {
							"type": "rect",
							"x": 130,
							"y": 67,
							"width": 179,
							"height": 179
						}
					}
				],
				"type": "mask",
				"kind": "opacity"
			},
			"mask2": {
				"children": [
					{
						"id": "shape-4",
						"type": "shape",
						"visible": false,
						"style": {
							"fill": {
								"type": "solid",
								"color": {
									"r": 0,
									"g": 113.686632,
									"b": 187.776986,
									"a": 1
								}
							}
						},
						"children": [],
						"title": "Rectangle 1",
						"visualBounds": {
							"top": 67,
							"left": 130,
							"bottom": 245,
							"right": 309
						},
						"shape": {
							"type": "rect",
							"x": 130,
							"y": 67,
							"width": 179,
							"height": 179
						}
					}
				],
				"type": "mask",
				"kind": "opacity"
			}
		}
	},
	"children": [
		{
			"type": "shape",
			"visible": false,
			"visualBounds": {
				"left": 50,
				"right": 150,
				"top": 50,
				"bottom": 150
			},
			"shape": {
				"type": "circle",
				"cx": 100,
				"cy": 100,
				"r": 50
			},
			"style": {
				"stroke": {
					"type": "solid",
					"color": {
						"r": 255,
						"g": 0,
						"b": 0,
						"a": 1
					},
					"width": 10,
					"stroke-opacity": 1
				},
				"mask": "mask1"
			}
		},
		{
			"type": "shape",
			"visualBounds": {
				"left": 100,
				"right": 300,
				"top": 100,
				"bottom": 300
			},
			"shape": {
				"type": "rect",
				"x": 100,
				"y": 100,
				"width": 200,
				"height": 200
			},
			"style": {
				"mask": "mask2",
				"fill": {
					"type": "solid",
					"color": {
						"r": 0,
						"g": 0,
						"b": 0,
						"a": 1
					}
				}
			}
		}
	]
}