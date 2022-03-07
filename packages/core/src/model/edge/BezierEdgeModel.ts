import { action, observable } from 'mobx';
import BaseEdgeModel from './BaseEdgeModel';
import { Point } from '../../type';
import { ModelType } from '../../constant/constant';
import { getBezierControlPoints, IBezierControls } from '../../util/edge';
import { defaultTheme } from '../../constant/DefaultTheme';

export { BezierEdgeModel };
export default class BezierEdgeModel extends BaseEdgeModel {
  modelType = ModelType.BEZIER_EDGE;
  offset = defaultTheme.bezier.offset;
  @observable path = '';
  constructor(data, graphModel) {
    super(data, graphModel, 'bezier');
  }

  getTextPosition(): Point {
    if (this.pointsList && this.pointsList.length > 0) {
      let pointsXSum = 0;
      let pointsYSum = 0;
      this.pointsList.forEach(({ x, y }) => {
        pointsXSum += x;
        pointsYSum += y;
      });
      return {
        x: pointsXSum / this.pointsList.length,
        y: pointsYSum / this.pointsList.length,
      };
    }
    return {
      x: (this.startPoint.x + this.endPoint.x) / 2,
      y: (this.startPoint.y + this.endPoint.y) / 2,
    };
  }
  getData() {
    const data = super.getData();
    const pointsList = this.pointsList.map(({ x, y }) => ({ x, y }));
    return {
      ...data,
      pointsList,
    };
  }

  // 自定义贝塞尔曲线控制点
  getControlPoints() {
    const { sNext, ePre } = this.getControls();

    const { edges } = this.graphModel.modelToGraphData();

    // 获得所有同节点的边
    const curEdges = edges.filter(x => x.sourceNodeId === this.sourceNodeId
      && x.targetNodeId === this.targetNodeId && x.type === ModelType.BEZIER_EDGE);

    const sNextList = curEdges.map(x => x.pointsList[1]);
    const ePreList = curEdges.map(x => x.pointsList[2]);

    if (sNextList.filter(p => p.y < sNext.y).length > sNextList.filter(p => p.y > sNext.y).length) {
      sNextList.forEach(p => {
        if (p.y > sNext.y) {
          sNext.x = p.x;
          sNext.y = p.y;
        }
      });
      sNext.y += 40;
    } else {
      sNextList.forEach(p => {
        if (p.y < sNext.y) {
          sNext.x = p.x;
          sNext.y = p.y;
        }
      });
      sNext.y -= 40;
    }

    if (ePreList.filter(p => p.y < ePre.y).length > ePreList.filter(p => p.y > ePre.y).length) {
      ePreList.forEach(p => {
        if (p.y > ePre.y) {
          ePre.x = p.x;
          ePre.y = p.y;
        }
      });
      ePre.y += 40;
    } else {
      ePreList.forEach(p => {
        if (p.y < ePre.y) {
          ePre.x = p.x;
          ePre.y = p.y;
        }
      });
      ePre.y -= 40;
    }

    return { sNext, ePre };
  }

  /* 获取贝塞尔曲线的控制点 */
  private getControls(): IBezierControls {
    const start = this.startPoint;
    const end = this.endPoint;
    const points = getBezierControlPoints(
      {
        start,
        end,
        sourceNode: this.sourceNode,
        targetNode: this.targetNode,
        offset: this.offset,
      },
    );
    return points;
  }
  /* 获取贝塞尔曲线的path */
  private getPath(points: Point[]): string {
    const [
      start, sNext, ePre, end,
    ] = points;
    return `M ${start.x} ${start.y}
    C ${sNext.x} ${sNext.y},
    ${ePre.x} ${ePre.y},
    ${end.x} ${end.y}`;
  }
  @action
  initPoints() {
    if (this.pointsList.length > 0) {
      this.path = this.getPath(this.pointsList);
    } else {
      this.updatePoints();
    }
  }

  @action
  updatePoints() {
    const start = {
      x: this.startPoint.x,
      y: this.startPoint.y,
    };
    const end = {
      x: this.endPoint.x,
      y: this.endPoint.y,
    };
    const { sNext, ePre } = this.getControlPoints();
    this.pointsList = [start, sNext, ePre, end];
    this.path = this.getPath(this.pointsList);
  }

  @action
  updatePath() {
    const start = {
      x: this.startPoint.x,
      y: this.startPoint.y,
    };
    const end = {
      x: this.endPoint.x,
      y: this.endPoint.y,
    };
    const [, sNext, ePre] = this.pointsList;
    this.pointsList = [start, sNext, ePre, end];
    this.path = this.getPath(this.pointsList);
  }

  @action
  updateStartPoint(anchor) {
    this.startPoint = anchor;
    this.updatePath();
  }

  @action
  updateEndPoint(anchor) {
    this.endPoint = anchor;
    this.updatePath();
  }

  @action
  updateAdjustAnchor(anchor: Point, type: string) {
    if (type === 'sNext') {
      this.pointsList[1] = anchor;
    } else if (type === 'ePre') {
      this.pointsList[2] = anchor;
    }
    this.path = this.getPath(this.pointsList);
  }
}
