import { SortableContainer, SortableElement, SortableHandle } from "react-sortable-hoc";
import { arrayMoveImmutable } from "array-move";

const component = ({ children }) => children;

const SortableItem = SortableElement(component);
const SortableListContainer = SortableContainer(component);
const SortHandle = SortableHandle(component);

function SortableList({ items, axis = "y", indexOffset = 0, useDragHandle, handleSort, children }) {
  function onSortEnd({ oldIndex, newIndex }) {
    handleSort(arrayMoveImmutable(items, oldIndex + indexOffset, newIndex + indexOffset));
  }

  return (
    <SortableListContainer
      distance={10}
      axis={axis}
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
