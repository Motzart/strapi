/**
 * 
 * VariableDraggableAttr
 */

/* eslint-disable react/no-find-dom-node */
import React from 'react';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import {
  DragSource,
  DropTarget,
} from 'react-dnd';
import { get, flow } from 'lodash';
import cn from 'classnames';
import ClickOverHint from 'components/ClickOverHint';
import DraggedRemovedIcon  from 'components/DraggedRemovedIcon';
import VariableEditIcon from 'components/VariableEditIcon';
import styles from './styles.scss';

const getBootstrapClass = attrType => {
  switch(attrType) {
    case 'checkbox':
    case 'boolean':
      return {
        bootstrap: 'col-md-3',
        wrapper: cn(styles.attrWrapper),
        withLongerHeight: false,
      };
    case 'date':
      return {
        bootstrap: 'col-md-4',
        wrapper: cn(styles.attrWrapper),
        withLongerHeight: false,
      };
    case 'json':
    case 'wysiwyg':
    case 'WYSIWYG':
      return {
        bootstrap: 'col-md-12', 
        wrapper: cn(styles.attrWrapper, styles.customHeight),
        withLongerHeight: true,
      };
    case 'file':
      return {
        bootstrap: 'col-md-6',
        wrapper: cn(styles.attrWrapper, styles.customHeight),
        withLongerHeight: true,
      };
    default:
      return {
        bootstrap: 'col-md-6',
        wrapper: cn(styles.attrWrapper),
        withLongerHeight: false,
      };
  }
};
const variableDraggableAttrSource = {
  beginDrag: (props) => {
    props.beginMove(props.name, props.index);

    return {
      id: props.id,
      index: props.index,
    };
  },
  endDrag: props => {
    props.endMove();
    return {};
  },
};
const variableDraggableAttrTarget = {
  hover: (props, monitor, component) => {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Determine rectangle on screen
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2; // NOTE: Change the divider for wysiwyg

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return;
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return;
    }

    // Time to actually perform the action
    props.moveAttr(dragIndex, hoverIndex, props.keys);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().index = hoverIndex;
  },
};

class VariableDraggableAttr extends React.PureComponent {
  constructor(props) {
    super(props);
    const { data, layout, name } = this.props;
    const appearance = get(layout, [name, 'appearance'], '');
    const type = appearance !== '' ? appearance : data.type;    
    let classNames = getBootstrapClass(type);
    let style = {};

    if (!type) {
      style = { backgroundColor: 'blue', opacity: 0.2 };
      classNames = {
        bootstrap: name.split('__')[1],
        wrapper: cn(styles.attrWrapper),
        withLongerHeight: false,
      };
    }
    this.state = {
      classNames,
      dragStart: false,
      isOver: false,
      style,
    };
  }

  handleClickEdit = () => {
    this.props.onClickEdit(this.props.index);
  }

  handleDragEffect = () => this.setState(prevState => ({ dragStart: !prevState.dragStart }));

  handleMouseEnter= () => {
    if (this.props.data.type !== 'boolean') {
      this.setState({ isOver: true });
    }
  }

  handleMouseLeave = () => this.setState({ isOver: false });

  handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const { index, keys, onRemove } = this.props;
    onRemove(index, keys);
  }

  renderContent = () => {
    const { classNames, isOver, style } = this.state;
    const { data, isEditing, name } = this.props;

    return (
      <div className={cn(classNames.wrapper, isEditing && styles.editingVariableAttr)} style={style}>
        <i className="fa fa-th" />
        <span className={styles.truncated}>
          {name}
        </span>
        <ClickOverHint show={isOver} />
        {!isOver && get(data, 'name', '').toLowerCase() !== get(data, 'label', '').toLowerCase() && (
          <div className={styles.info}>
            {data.label}
          </div>
        )}
        {isEditing && !isOver ? (
          <VariableEditIcon withLongerHeight={classNames.withLongerHeight} onClick={this.handleClickEdit} />
        ) : (
          <DraggedRemovedIcon withLongerHeight={classNames.withLongerHeight} onRemove={this.handleRemove} />
        )}
      </div>
    );
  }

  renderSource = () => {
    const { classNames } = this.state;

    if (classNames.bootstrap.includes('12')) { // TODO: design
      return <div style={{ width: '100%', height: '10px', background: 'red' }} />;
    }

    return this.renderContent();
  }

  render() {
    const { classNames } = this.state;
    const {
      connectDragSource,
      connectDropTarget,
      isDragging,
    } = this.props;
    const divStyle = isDragging ? { opacity: 0.2 } : {};

    return (
      connectDragSource(
        connectDropTarget(
          <div
            className={cn(classNames.bootstrap)} // NOTE: bootstrap grid handles the weird effect when dragging
            onDragStart={this.handleDragEffect}
            onDragEnd={this.handleDragEffect}
            onMouseEnter={this.handleMouseEnter}
            onMouseLeave={this.handleMouseLeave}
            onClick={this.handleClickEdit}
            style={divStyle}
          >
            {/* {this.renderContent()} */}
            {isDragging ? this.renderSource() : this.renderContent()}
            {/* <div className={cn(classNames.wrapper, isEditing && styles.editingVariableAttr)} style={style}>
              <i className="fa fa-th" />
              <span className={styles.truncated}>
                {name}
              </span>
              <ClickOverHint show={isOver} />
              {!isOver && get(data, 'name', '').toLowerCase() !== get(data, 'label', '').toLowerCase() && (
                <div className={styles.info}>
                  {data.label}
                </div>
              )}
              {isEditing && !isOver ? (
                <VariableEditIcon withLongerHeight={classNames.withLongerHeight} onClick={this.handleClickEdit} />
              ) : (
                <DraggedRemovedIcon withLongerHeight={classNames.withLongerHeight} onRemove={this.handleRemove} />
              )}
            </div> */}
          </div>
        ),
      )
    );
  }
}

VariableDraggableAttr.defaultProps = {
  data: {
    type: 'text',
  },
  index: 0,
  isDragging: false,
  isEditing: false,
  keys: '',
  layout: {},
  name: '',
  onClickEdit: () => {},
  onRemove: () => {},
};

VariableDraggableAttr.propTypes = {
  connectDragSource: PropTypes.func.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
  data: PropTypes.object,
  index: PropTypes.number,
  isDragging: PropTypes.bool,
  isEditing: PropTypes.bool,
  keys: PropTypes.string,
  layout: PropTypes.object,
  name: PropTypes.string,
  onClickEdit: PropTypes.func,
  onRemove: PropTypes.func,
};

const withDropTarget = DropTarget('variableDraggableAttr', variableDraggableAttrTarget, (connect) => ({
  connectDropTarget: connect.dropTarget(),
}));
const withDragSource = DragSource('variableDraggableAttr', variableDraggableAttrSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
}));

export default flow([withDropTarget, withDragSource])(VariableDraggableAttr);