import { parseLocaleString } from "utils";

type Props = {
  locale: any,
  removedItemsCount: number,
  undoRemovedTasks: () => void
}

export default function Footer({ locale, removedItemsCount, undoRemovedTasks }: Props) {
  const completeMessage = parseLocaleString(locale.tasks.task_complete_mesasge, <span className="tasks-dialog-count" key={removedItemsCount}>{removedItemsCount}</span>, removedItemsCount > 1 ? locale.tasks.task_plural : locale.tasks.task_singular);

  return (
    <div className="container-footer tasks-dialog">
      <span>{completeMessage}</span>
      <button className="btn text-btn" onClick={undoRemovedTasks}>{locale.tasks.undo}</button>
    </div>
  );
}
