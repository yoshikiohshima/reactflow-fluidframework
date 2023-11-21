import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
    addEdge,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Position,
    MarkerType,
} from 'reactflow';

import CustomNode from './CustomNode';

import 'reactflow/dist/style.css';
import './overview.css';

import { TinyliciousClient } from "@fluidframework/tinylicious-client";
import { LoadableObjectRecord, SharedMap } from "fluid-framework";

//import {FlowModel} from "./model";

const nodeTypes = {
    custom: CustomNode,
};

const minimapStyle = {
    height: 120,
};

const onInit = (reactFlowInstance) => console.log('flow loaded:', reactFlowInstance);

const getFluidData = async () => {
    const client = new TinyliciousClient();

    const containerSchema = {
        initialObjects: {nodes: SharedMap, edges: SharedMap}
    };

    let container;
    const containerId = location.hash.substring(1);
    if (!containerId) {
        ({ container } = await client.createContainer(containerSchema));
        const id = await container.attach();
        location.hash = id;
    } else {
        ({ container } = await client.getContainer(containerId, containerSchema));
    }

    return container.initialObjects;
}

const initialNodes = [
    {
        id: '1',
        type: 'input',
        data: {
            label: 'Input Node',
        },
        position: { x: 250, y: 0 },
    },
    {
        id: '2',
        data: {
            label: 'Default Node',
        },
        position: { x: 100, y: 100 },
    },
    {
        id: '3',
        type: 'output',
        data: {
            label: 'Output Node',
        },
        position: { x: 400, y: 100 },
    },
    {
        id: '4',
        type: 'custom',
        position: { x: 100, y: 200 },
        data: {
            selects: {
                'handle-0': 'smoothstep',
                'handle-1': 'smoothstep',
            },
        },
    },
    {
        id: '5',
        type: 'output',
        data: {
            label: 'custom style',
        },
        className: 'circle',
        style: {
            background: '#2B6CB0',
            color: 'white',
        },
        position: { x: 400, y: 200 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
    },
    {
        id: '6',
        type: 'output',
        style: {
            background: '#63B3ED',
            color: 'white',
            width: 100,
        },
        data: {
            label: 'Node',
        },
        position: { x: 400, y: 325 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
    },
    {
        id: '7',
        type: 'default',
        className: 'annotation',
        /*
          data: {
          label: (
          <>
          On the bottom left you see the <strong>Controls</strong> and the bottom right the{' '}
          <strong>MiniMap</strong>. This is also just a node 🥳
          </>
          ),
          },
        */
        draggable: false,
        selectable: false,
        position: { x: 150, y: 400 },
    },
];

const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', label: 'this is an edge label' },
    { id: 'e1-3', source: '1', target: '3', animated: true },
    {
        id: 'e4-5',
        source: '4',
        target: '5',
        type: 'smoothstep',
        sourceHandle: 'handle-0',
        data: {
            selectIndex: 0,
        },
        markerEnd: {
            type: MarkerType.ArrowClosed,
        },
    },
    {
        id: 'e4-6',
        source: '4',
        target: '6',
        type: 'smoothstep',
        sourceHandle: 'handle-1',
        data: {
            selectIndex: 1,
        },
        markerEnd: {
            type: MarkerType.ArrowClosed,
        },
    },
];

const FlowView = () => {
    const [fluidSharedObjects, setFluidSharedObjects] = useState();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        getFluidData().then(data => {
	    if ([...data.edges.keys()].length === 0) {
                initialEdges.forEach((e) => {
                    data.edges.set(e.id, e);
                });
            }
	    if ([...data.nodes.keys()].length === 0) {
                initialNodes.forEach((n) => {
                    data.nodes.set(n.id, n);
                });
            }
            setFluidSharedObjects(data);
        });
    }, []);

    // we are using a bit of a shortcut here to adjust the edge type
    // this could also be done with a custom edge for example
    const edgesWithUpdatedTypes = (es) => {
        return es.map((edge) => {
            if (edge.sourceHandle) {
                const edgeType = "";
                edge.type = edgeType;
            }
            return edge;
        });
    };

    const updateNodes = () => {
        const newNodes = [...fluidSharedObjects.nodes.entries()].map(([a, b]) => b);
        setNodes(newNodes);
    };

    const updateEdges = () => {
        let newEdges = edgesWithUpdatedTypes([...fluidSharedObjects.edges.entries()].map(([a, b]) => b));
        setEdges(newEdges);
    };

    useEffect(() => {
        if (fluidSharedObjects) {
            fluidSharedObjects.nodes.on("valueChanged", updateNodes);
        }
    }, [fluidSharedObjects]);

    const myOnNodesChange = (actions) => {
        let keys = [...fluidSharedObjects.nodes.keys()];
        const findNodeIndex = (node) => {
            for (let i = 0; i < keys.length; i++) {
                if (keys[i] === node.id) {
                    return i;
                }
            }
            return -1;
        }
       
        actions.forEach((action) => {
            const index = findNodeIndex(action);
            if (index >= 0)  {
                // https://reactflow.dev/api-reference/types/node-change
                // export type NodeChange =
                // | NodeDimensionChange
                // | NodePositionChange
                // | NodeSelectionChange
                // | NodeRemoveChange
                // | NodeAddChange
                // | NodeResetChange;
                // console.log(action);
                if (action.type === "dimensions") {
                    let entry = {...fluidSharedObjects.nodes.get(action.id)};
                    entry[action.type] = action[action.type];
                    fluidSharedObjects.nodes.set(action.id, entry);
                } else if (action.type === "select") {
                    // console.log("select", viewId);
                    
                } else if (action.type === "position" && action.dragging) {
                    // console.log("drag", this.nodeOwnerMap.get(action.id), viewId);
                    let entry = {...fluidSharedObjects.nodes.get(action.id)};
                    entry[action.type] = action[action.type];
                    entry["positionAbsolute"] = action["positionAbsolute"];
                    fluidSharedObjects.nodes.set(action.id, entry);
                } else if (action.type === "position" && !action.dragging) {
                }
            }
        });

        onNodesChange(actions);
    };

    const myOnEdgesChange = (actions) => {
        onEdgesChange(actions);
    };

    return (
        <div id="all">
            <div id="sidebar">
            </div>
            <ReactFlow
                id="flow"
                nodes={nodes}
                edges={edges}
                onNodesChange={myOnNodesChange}
                onEdgesChange={myOnEdgesChange}
                onInit={onInit}
                fitView
                attributionPosition="top-right"
                nodeTypes={nodeTypes}
            >
            <MiniMap style={minimapStyle} zoomable pannable />
            <Controls />
            <Background color="#aaa" gap={16} />
            </ReactFlow>
        </div>
  );
};

export default FlowView;
