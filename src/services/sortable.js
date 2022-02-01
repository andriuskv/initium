import { SortableContainer, SortableElement, SortableHandle } from "react-sortable-hoc";
import { arrayMoveImmutable } from "array-move";

const component = ({ children }) => children;

const SortableItem = SortableElement(component);
const SortableListContainer = SortableContainer(component);
const SortHandle = SortableHandle(component);

function SortableList({ items, axis = "y", indexOffset = 0, useDragHandle, handleSort, children }) {
  const options = {};

  if (axis === "xy") {
    options.axis = axis;
  }
  else {
    options.lockAxis = axis;
  }

  function onSortEnd({ oldIndex, newIndex }) {
    handleSort(arrayMoveImmutable(items, oldIndex + indexOffset, newIndex + indexOffset));
  }

  return (
    <SortableListContainer
      {...options}
      distance={10}
      useDragHandle={useDragHandle}
      lockToContainerEdges={true}
      lockOffset={["0%", "0%"]}
      helperClass="dragging"
      onSortEnd={onSortEnd}>{children}</SortableListContainer>
  );
}

export {
  SortableItem,
  SortableList,
  SortHandle
};
