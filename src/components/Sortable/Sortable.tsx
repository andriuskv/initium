import type { PropsWithChildren, FC } from "react";
import type {
  Activators,
  KeyboardSensorOptions,
  UniqueIdentifier,
  DragStartEvent,
  DragCancelEvent
} from "@dnd-kit/core";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  useSortable,
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  rectSortingStrategy
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToFirstScrollableAncestor
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import Icon from "components/Icon";

class CustomKeyboardSensor extends KeyboardSensor {
  static activators: Activators<KeyboardSensorOptions> = [
    {
      eventName: "onKeyDown",
      handler: ({ nativeEvent: event }) => {
        if (event.key === " " || event.key === "Enter") {
          if (event.target.getAttribute("aria-roledescription") === "sortable") {
            event.preventDefault();
            return true;
          }
          return false;
        }
        return false;
      }
    }
  ];
}

type ListProps = PropsWithChildren & {
  items: ({ id: UniqueIdentifier; })[],
  axis?: "xy" | "x" | "y",
  handleDragStart: (event: DragStartEvent) => void,
  handleSort: (newItems?: unknown[] | null) => void
}

function SortableList({ children, items, axis, handleDragStart, handleSort }: ListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(CustomKeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );
  const modifiers = [restrictToFirstScrollableAncestor];
  let sortingStrategy = verticalListSortingStrategy;

  if (axis === "xy") {
    sortingStrategy = rectSortingStrategy;
  }
  else if (axis === "x") {
    sortingStrategy = horizontalListSortingStrategy;
  }
  else {
    modifiers.push(restrictToVerticalAxis);
  }

  function handleDragEnd({ active, over }: DragCancelEvent) {
    if (!active || !over) {
      return;
    }
    let newItems: unknown[] | null = null;

    if (active.id !== over.id) {
      const oldIndex = items.findIndex(({ id }) => id === active.id);
      const newIndex = items.findIndex(({ id }) => id === over.id);

      newItems = arrayMove(items, oldIndex, newIndex);
    }
    handleSort(newItems);
  }

  function handleDragCancel() {
    handleSort();
  }

  return (
    <DndContext
      sensors={sensors}
      modifiers={modifiers}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}>
      <SortableContext items={items} strategy={sortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

type ItemProps = PropsWithChildren & {
  id: UniqueIdentifier,
  className?: string,
  component?: { Component: FC<any>; params: any },
  handleTitle?: string
}

function SortableItem({ children, id, className, component, handleTitle }: ItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  if (component) {
    return (
      <li ref={setNodeRef} style={style} className={className}>
        <component.Component {...component.params}>
          <button type="button" className="btn icon-btn drag-handle" {...attributes} {...listeners} title={handleTitle || "Drag"}>
            <Icon id="drag"/>
          </button>
        </component.Component>
      </li>
    );
  }
  return <li ref={setNodeRef} style={style} className={className} {...attributes} {...listeners}>{children}</li>;
}

export {
  SortableList,
  SortableItem
};
