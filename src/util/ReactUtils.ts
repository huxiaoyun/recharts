import React, { Children } from 'react';
import _ from 'lodash';
import { keys } from 'ts-transformer-keys';
import { ReactNode } from 'react';
import { isNumber } from './DataUtils';
import { shallowEqual } from './ShallowEqual';
import { PresentationAttributes, DOMAttributesWithProps } from './types';

const REACT_BROWSER_EVENT_MAP: any = {
  click: 'onClick',
  mousedown: 'onMouseDown',
  mouseup: 'onMouseUp',
  mouseover: 'onMouseOver',
  mousemove: 'onMouseMove',
  mouseout: 'onMouseOut',
  mouseenter: 'onMouseEnter',
  mouseleave: 'onMouseLeave',
  touchcancel: 'onTouchCancel',
  touchend: 'onTouchEnd',
  touchmove: 'onTouchMove',
  touchstart: 'onTouchStart',
};

type eventFunc = (data: any, index: number, e: any) => {}

export const SCALE_TYPES = [
  'auto', 'linear', 'pow', 'sqrt', 'log', 'identity', 'time', 'band', 'point',
  'ordinal', 'quantile', 'quantize', 'utc', 'sequential', 'threshold',
];

export const LEGEND_TYPES = [
  'plainline', 'line', 'square', 'rect', 'circle', 'cross',
  'diamond', 'star', 'triangle', 'wye', 'none',
];

export const TOOLTIP_TYPES = [
  'none',
];

/**
 * Get the display name of a component
 * @param  {Object} Comp Specified Component
 * @return {String}      Display name of Component
 */
export const getDisplayName = (Comp: any) => {
  if (typeof Comp === 'string') {
    return Comp;
  }
  if (!Comp) { return ''; }
  return Comp.displayName || Comp.name || 'Component';
};

/*
 * Find and return all matched children by type. `type` can be a React element class or
 * string
 */
export const findAllByType = (children: ReactNode, type: string | string[]): React.DetailedReactHTMLElement<any, HTMLElement>[] => {
  const result: React.DetailedReactHTMLElement<any, HTMLElement>[] = [];
  let types: string[] = [];

  if (_.isArray(type)) {
    types = type.map(t => getDisplayName(t));
  } else {
    types = [getDisplayName(type)];
  }

  React.Children.forEach(children, (child: React.DetailedReactHTMLElement<any, HTMLElement>) => {
    // @ts-ignore
    const childType = child && child.type && (child.type.displayName || child.type.name);
    if (types.indexOf(childType) !== -1) {
      result.push(child);
    }
  });

  return result;
};
/*
 * Return the first matched child by type, return null otherwise.
 * `type` can be a React element class or string.
 */
export const findChildByType = (children: ReactNode[], type: string): React.DetailedReactHTMLElement<any, HTMLElement> => {
  const result = findAllByType(children, type);

  return result && result[0];
};

/*
 * Create a new array of children excluding the ones matched the type
 */
export const withoutType = (children: ReactNode, type: string) => {
  const newChildren: ReactNode[] = [];
  let types: string[];

  if (_.isArray(type)) {
    types = type.map(t => getDisplayName(t));
  } else {
    types = [getDisplayName(type)];
  }

  React.Children.forEach(children, (child) => {
    // @ts-ignore
    if (child && child.type && child.type.displayName && types.indexOf(child.type.displayName) !== -1) {
      return;
    }
    newChildren.push(child);
  });

  return newChildren;
};

/**
 * get all the presentation attribute of svg element
 * @param  {Object} el A react element or the props of a react element
 * @return {Object}    attributes or null
 */
export const getPresentationAttributes = (el: any) => {
  if (!el || _.isFunction(el)) { return null; }

  const props = React.isValidElement(el) ? el.props : el;

  if (!_.isObject(props)) { return null; }

  let out = null;
  // eslint-disable-next-line no-restricted-syntax
  for (const i in props) {
    if ({}.hasOwnProperty.call(props, i) && keys<PresentationAttributes<any>>().indexOf(i as any) >= 0) {
      if (!out) out = {};
      // @ts-ignore
      out[i] = props[i];
    }
  }
  return out;
};

const getEventHandlerOfElement = (originalHandler: any, props: any) => (
  (e: any): any => {
    originalHandler(props, e);

    return null;
  }
);
/**
 * get all the event attribute of svg element
 * @param  {Object}   el           A react element or the props of a react element
 * @param  {Function} newHandler   New handler of event
 * @param  {Boolean}  wrapCallback Wrap callback and return more parameters or not
 * @return {Object}                attributes or null
 */
export const filterEventAttributes = (el: any, newHandler?: any, wrapCallback: boolean = false): any => {
  if (!el || _.isFunction(el)) { return null; }

  const props = React.isValidElement(el) ? el.props : el;

  if (!_.isObject(props)) { return null; }

  let out: any = {};
  // eslint-disable-next-line no-restricted-syntax
  for (const i in props) {
    if ({}.hasOwnProperty.call(props, i) && keys<DOMAttributesWithProps<any, any>>().indexOf(i as any) >= 0) {
      if (!out) out = {};
      // @ts-ignore
      const eventHandler = props[i];
      out[i] = newHandler || (wrapCallback ? getEventHandlerOfElement(eventHandler, props) : eventHandler);
    }
  }
  return out;
};

const getEventHandlerOfChild = (originalHandler: eventFunc, data: any, index: number) => (
  (e: any): null => {
    originalHandler(data, index, e);

    return null;
  }
);

export const filterEventsOfChild = (props: any, data: any, index: number): any => {
  if (!_.isObject(props)) { return null; }

  let out: any = null;
  // eslint-disable-next-line no-restricted-syntax
  for (const i in props) {
    // @ts-ignore
    if ({}.hasOwnProperty.call(props, i) &&keys<IEvent>().indexOf(i as any) >= 0 && _.isFunction(props[i])) {
      if (!out) out = {};
      // @ts-ignore
      out[i] = getEventHandlerOfChild(props[i], data, index);
    }
  }
  return out;
};

/**
 * validate the width and height props of a chart element
 * @param  {Object} el A chart element
 * @return {Boolean}   true If the props width and height are number, and greater than 0
 */
export const validateWidthHeight = (el: any): boolean => {
  if (!el || !el.props) { return false; }
  const { width, height } = el.props;

  if (!isNumber(width) || width <= 0 ||
    !isNumber(height) || height <= 0) {
    return false;
  }

  return true;
};

export const isSsr = (): boolean => (
  !(typeof window !== 'undefined' && window.document && window.document.createElement &&
    window.setTimeout)
);

const SVG_TAGS: string[] = ['a', 'altGlyph', 'altGlyphDef', 'altGlyphItem', 'animate',
  'animateColor', 'animateMotion', 'animateTransform', 'circle', 'clipPath',
  'color-profile', 'cursor', 'defs', 'desc', 'ellipse', 'feBlend', 'feColormatrix',
  'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting',
  'feDisplacementMap', 'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG',
  'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode', 'feMorphology',
  'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile',
  'feTurbulence', 'filter', 'font', 'font-face', 'font-face-format', 'font-face-name',
  'font-face-url', 'foreignObject', 'g', 'glyph', 'glyphRef', 'hkern', 'image',
  'line', 'lineGradient', 'marker', 'mask', 'metadata', 'missing-glyph', 'mpath',
  'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect', 'script',
  'set', 'stop', 'style', 'svg', 'switch', 'symbol', 'text', 'textPath', 'title',
  'tref', 'tspan', 'use', 'view', 'vkern'];

const isSvgElement = (child: any) => (
  child && child.type && _.isString(child.type) && SVG_TAGS.indexOf(child.type) >= 0
);

/**
 * Filter all the svg elements of children
 * @param  {Array} children The children of a react element
 * @return {Array}          All the svg elements
 */
export const filterSvgElements = (children: React.ReactElement[]): React.ReactElement[] => {
  const svgElements = [] as React.ReactElement[];

  React.Children.forEach(children, (entry: React.ReactElement) => {
    if (entry && entry.type && _.isString(entry.type) &&
      SVG_TAGS.indexOf(entry.type) >= 0) {
      svgElements.push(entry);
    }
  });

  return svgElements;
};
export const isSingleChildEqual = (nextChild: React.ReactElement, prevChild: React.ReactElement): boolean => {
  if (_.isNil(nextChild) && _.isNil(prevChild)) {
    return true;
  } if (!_.isNil(nextChild) && !_.isNil(prevChild)) {
    const { children: nextChildren, ...nextProps } = nextChild.props || {};
    const { children: prevChildren, ...prevProps } = prevChild.props || {};

    if (nextChildren && prevChildren) {
      // eslint-disable-next-line no-use-before-define
      return shallowEqual(nextProps, prevProps) && isChildrenEqual(nextChildren, prevChildren);
    } if (!nextChildren && !prevChildren) {
      return shallowEqual(nextProps, prevProps);
    }

    return false;
  }

  return false;
};
/**
 * Wether props of children changed
 * @param  {Object} nextChildren The latest children
 * @param  {Object} prevChildren The prev children
 * @return {Boolean}             equal or not
 */
export const isChildrenEqual = (nextChildren: React.ReactElement[], prevChildren: React.ReactElement[]): boolean => {
  if (nextChildren === prevChildren) { return true; }

  if (Children.count(nextChildren) !== Children.count(prevChildren)) { return false; }
  const count = Children.count(nextChildren);

  if (count === 0) { return true; }
  if (count === 1) {
    return isSingleChildEqual(
      _.isArray(nextChildren) ? nextChildren[0] : nextChildren,
      _.isArray(prevChildren) ? prevChildren[0] : prevChildren,
    );
  }

  for (let i = 0; i < count; i++) {
    const nextChild: any = nextChildren[i];
    const prevChild: any = prevChildren[i];

    if (_.isArray(nextChild) || _.isArray(prevChild)) {
      if (!isChildrenEqual(nextChild, prevChild)) {
        return false;
      }
    } else if (!isSingleChildEqual(nextChild, prevChild)) {
      return false;
    }
  }

  return true;
};

export const renderByOrder = (children: React.ReactElement[], renderMap: any) => {
  let elements: React.ReactElement[] = [];
  const record: any = {};

  Children.forEach(children, (child, index) => {
    if (child && isSvgElement(child)) {
      elements.push(child);
    } else if (child && renderMap[getDisplayName(child.type)]) {
      const displayName = getDisplayName(child.type);
      const { handler, once } = renderMap[displayName];

      if ((once && !record[displayName]) || !once) {
        const results = handler(child, displayName, index);

        if (_.isArray(results)) {
          elements = [elements, ...results];
        } else {
          elements.push(results);
        }

        record[displayName] = true;
      }
    }
  });

  return elements;
};

export const getReactEventByType = (e: any) => {
  const type = e && e.type;

  if (type && REACT_BROWSER_EVENT_MAP[type]) {
    return REACT_BROWSER_EVENT_MAP[type];
  }

  return null;
};

export const parseChildIndex = (child: any, children: any[]) => {
  let result = -1;
  Children.forEach(children, (entry, index) => {
    if (entry === child) {
      result = index;
    }
  });

  return result;
};
