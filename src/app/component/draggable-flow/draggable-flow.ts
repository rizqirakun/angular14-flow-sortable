import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  EFConnectableSide,
  EFConnectionBehavior,
  EFMarkerType,
  FCanvasComponent,
  FFlowComponent,
  FFlowModule,
  FSelectionChangeEvent,
  FZoomDirective,
} from '@foblex/flow';
import * as dagre from 'dagre';
import { IPoint, PointExtensions } from '@foblex/2d';
import { graphlib } from 'dagre';
import Graph = graphlib.Graph;
import { generateGuid } from '@foblex/utils';
import { CommonModule } from '@angular/common';
interface INodeViewModel {
  id: string;
  connectorId: string;
  position: IPoint;
  data?: string;
}
interface IConnectionViewModel {
  id: string;
  from: string;
  to: string;
}

interface Node {
  id: string;
  parentId: string | null;
  data?: {
    name: string;
    courseTotal: number;
    checked: boolean;
    restricted: boolean;
  };
}

@Component({
  selector: 'draggable-flow',
  styleUrls: ['./draggable-flow.scss'],
  templateUrl: './draggable-flow.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FFlowModule, CommonModule],
})
export class DraggableFlowComponent implements OnInit {
  public nodes: INodeViewModel[] = [];
  public connections: IConnectionViewModel[] = [];
  public configuration = CONFIGURATION[Direction.TOP_TO_BOTTOM];
  @ViewChild(FFlowComponent, { static: false })
  public fFlowComponent!: FFlowComponent;
  @ViewChild(FCanvasComponent, { static: false })
  public fCanvasComponent!: FCanvasComponent;
  @ViewChild(FZoomDirective , { static: false })
  public fZoomDirective !: FZoomDirective;
  public isAutoLayout: boolean = false;
  public selection?: FSelectionChangeEvent;
  showCanvas = false;
  nodeSelected?: string;
  nodesChecked: string[] = [];
  showToolbarOptions: boolean = false;

  graphNodes: Node[] = [
    // { id: 'Node1', parentId: null, data: 'Pippo' },
    // { id: 'Node2', parentId: 'Node1', data: 'Monami' },
    // { id: 'Node3', parentId: 'Node2' },
    // { id: 'Node4', parentId: 'Node3' },
    // { id: 'Node5', parentId: 'Node4' },
    {
      id: 'Node1',
      parentId: null,
      data: {
        name: 'Hazard Identification and Risk Assessment Electrical Safety and Lockout/Tagout Procedures Emergency Response and Evacuation Procedures Hazard Identification and Risk Assessment Electrical Safety and Lockout/Tagout Procedures Emergency Response and Evacuation Procedures ',
        courseTotal: 9,
        checked: false,
        restricted: false
      },
    },
    {
      id: 'Node2',
      parentId: 'Node1',
      data: {
        name: 'Hazardous Substances Management',
        courseTotal: 1,
        checked: false,
        restricted: true
      },
    }
  ];

  public ngOnInit(): void {
    this.getData(new dagre.graphlib.Graph(), Direction.TOP_TO_BOTTOM);
  }
  public onLoaded(): void {
    if (this.graphNodes.length) {
      this.fitToScreen();
      return;
    }

    this.fitToScreen({ point: [400, 400] });
  }

  public onSelectionChange(event: FSelectionChangeEvent): void {
    this.selection = event;
    this.nodeSelected = event.nodes.pop();
  }

  private getData(graph: Graph, direction: Direction): void {
    if (this.isAutoLayout) {
      this.fFlowComponent?.reset();
      // if auto layout is disabled, onLoaded will be called only after the first rendering of the flow
    }
    this.setGraph(graph, direction);
    this.nodes = this.getNodes(graph);
    this.connections = this.getConnections(graph);
  }
  private setGraph(graph: Graph, direction: Direction): void {
    this.configuration = CONFIGURATION[direction];
    graph.setGraph({ rankdir: direction });
    this.graphNodes.forEach((node) => {
      graph.setNode(node.id, { data: node.data, width: 528, height: 168 });

      if (node.parentId != null) {
        graph.setEdge(node.parentId, node.id, {});
      }
    });

    dagre.layout(graph);
  }
  private getNodes(graph: Graph): INodeViewModel[] {
    return graph.nodes().map((x: any) => {
      let node = graph.node(x);
      return {
        id: generateGuid(),
        connectorId: x,
        position: { x: node.x, y: node.y },
      };
    });
  }
  private getConnections(graph: Graph): IConnectionViewModel[] {
    return graph
      .edges()
      .map((x: any) => ({ id: generateGuid(), from: x.v, to: x.w }));
  }
  public horizontal(): void {
    this.getData(new dagre.graphlib.Graph(), Direction.LEFT_TO_RIGHT);
  }
  public vertical(): void {
    this.getData(new dagre.graphlib.Graph(), Direction.TOP_TO_BOTTOM);
  }
  public fitToScreen({ point = [500, 500] } = { point: [500, 500] }): void {
    this.fCanvasComponent.fitToScreen(
      PointExtensions.initialize(...point),
      false
    );

    this.showCanvas = true;
  }
  public onAutoLayoutChange(checked: boolean): void {
    this.isAutoLayout = checked;
  }
  public onNodePositionChange(event: IPoint) {
    console.log(event);
    console.log(this.nodes);
    const id = this.selection?.nodes?.[0];
    const selectionIndex = this.nodes.findIndex(
      (node) => node.connectorId === id
    );
    const matchIndex = this.nodes.findIndex((node) => {
      const isXTolerable = Math.abs(event.x - node.position.x) < 20;
      const isYTolerable = Math.abs(event.y - node.position.y) < 20;
      return isXTolerable && isYTolerable;
    });
    console.log(this.graphNodes[matchIndex]);
    console.log(this.selection);
    console.log(matchIndex);
    console.log(selectionIndex);

    if (matchIndex !== -1 && selectionIndex !== -1) {
      console.log(this.graphNodes);
      const temp = { ...this.graphNodes[selectionIndex] };
      this.graphNodes[selectionIndex].data = this.graphNodes[matchIndex].data;
      this.graphNodes[matchIndex].data = temp.data;
      console.log(this.graphNodes);
    }
    this.vertical();
  }

  onMouseMove(event: any) {
    console.log(event);
  }

  onNodeDragStart(event: any) {
    console.log(event);
    const nodeId = event.target.dataset?.fNodeId ?? '';
    event.dataTransfer.setData('id', nodeId);
  }

  onNodeDragOver(event: any) {
    event.preventDefault();
  }

  onNodeDrop(event: any) {
    event.preventDefault();
    const nodeFromId = event.dataTransfer.getData('id');
    const nodeToId = event.target.dataset?.fNodeId ?? event.target.closest(".f-node").dataset?.fNodeId ?? '';
    console.log(event);
    console.log(nodeFromId, nodeToId);
    this.graphNodes = this.moveNode(this.graphNodes, nodeFromId, nodeToId);
    this.vertical();
  }

  moveNode(
    graph: Node[],
    selectedNodeId: string,
    targetNodeId: string
  ): Node[] {
    // Find the selected and target nodes
    const selectedNodeIndex = graph.findIndex(
      (node) => node.id === selectedNodeId
    );
    const targetNodeIndex = graph.findIndex((node) => node.id === targetNodeId);

    // Check if the selectedNode and targetNode exist
    if (selectedNodeIndex === -1 || targetNodeIndex === -1) {
      throw new Error(
        'Either selectedNode or targetNode does not exist in the graph.'
      );
    }

    // If the selectedNode is already in the correct position, return the original graph
    if (selectedNodeIndex === targetNodeIndex) {
      return graph;
    }

    // Clone the graph to avoid mutating the original one
    const updatedGraph = [...graph];

    // Remove the selected node from its original position
    const [selectedNode] = updatedGraph.splice(selectedNodeIndex, 1);

    // If moving down, and the target is directly after the selected node, avoid double shifting
    let insertIndex = targetNodeIndex;

    if (selectedNodeIndex < targetNodeIndex) {
      // Insert just after the target node when moving down
      insertIndex = targetNodeIndex;
    } else {
      // Insert just before the target node when moving up
      insertIndex =
        targetNodeIndex < selectedNodeIndex
          ? targetNodeIndex
          : targetNodeIndex + 1;
    }

    // Insert the selected node into the correct position
    updatedGraph.splice(insertIndex, 0, selectedNode);

    // Rebuild the parentId relationships
    updatedGraph.forEach((node, idx) => {
      node.parentId = idx === 0 ? null : updatedGraph[idx - 1].id;
    });

    return updatedGraph;
  }

  addNew() {
    console.log('add new');
    this.graphNodes.push({
      id: 'Node1',
      parentId: null,
      data: {
        name: 'Hazard Identification and Risk Assessment Electrical Safety and Lockout/Tagout Procedures Emergency Response and Evacuation Procedures Hazard Identification and Risk Assessment Electrical Safety and Lockout/Tagout Procedures Emergency Response and Evacuation Procedures ',
        courseTotal: 9,
        checked: false,
        restricted: false
      },
    });

    this.graphNodes.push({
      id: 'Node2',
      parentId: 'Node1',
      data: {
        name: 'Hazardous Substances Management',
        courseTotal: 1,
        checked: false,
        restricted: true
      },
    });

    this.showCanvas = false;
    this.vertical();
  }

  toggleToolbarOptions() {
    this.fFlowComponent.clearSelection();
    this.showToolbarOptions = !this.showToolbarOptions;
  }

  protected readonly eMarkerType = EFMarkerType;
  protected readonly efConnectionBehavior = EFConnectionBehavior;

  get isNodesHaveRestrictedTarget() {
    return this.graphNodes.find(node => node.data?.restricted);
  }

  deleteNode(nodeIdToDelete: string): void {
    // Find the index of the node to delete
    const nodeIndexToDelete = this.graphNodes.findIndex((node) => node.id === nodeIdToDelete);

    if (nodeIndexToDelete === -1) {
      throw new Error('Node to delete does not exist in the graph.');
    }

    // Clone the graph to avoid mutating the original one
    const updatedGraph = [...this.graphNodes];

    // Get the node to delete and its parentId
    const nodeToDelete = updatedGraph[nodeIndexToDelete];
    const parentId = nodeToDelete.parentId;

    // Remove the node from the graph
    updatedGraph.splice(nodeIndexToDelete, 1);

    // Adjust the parentId of the deleted node's child, if any
    updatedGraph.forEach((node) => {
      if (node.parentId === nodeIdToDelete) {
        node.parentId = parentId; // Update to point to the deleted node's parent
      }
    });

    this.graphNodes = updatedGraph;
    this.vertical();
  };
}
enum Direction {
  LEFT_TO_RIGHT = 'LR',
  TOP_TO_BOTTOM = 'TB',
}
const CONFIGURATION = {
  [Direction.LEFT_TO_RIGHT]: {
    outputSide: EFConnectableSide.RIGHT,
    inputSide: EFConnectableSide.LEFT,
  },
  [Direction.TOP_TO_BOTTOM]: {
    outputSide: EFConnectableSide.BOTTOM,
    inputSide: EFConnectableSide.TOP,
  },
};
