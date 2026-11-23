import { useRef, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Grip } from "lucide-react";

type Item = { id: string; type: string; wide: boolean; column?: 1 | 2 };
type Props<T extends Item> = {
  widgets: T[];
  editing: boolean;
  selected: string;
  onSelect: (id: string) => void;
  onReorder: (widgets: T[]) => void;
  label: (widget: T) => string;
  renderWidget: (widget: T) => ReactNode;
  /** Можно ли ставить узкие виджеты в левую или правую колонку. */
  columns?: boolean;
  children: ReactNode;
};

function SortableWidget({
  widget,
  title,
  editing,
  selected,
  position,
  keyboardDragging,
  columns,
  onSelect,
  children,
}: {
  widget: Item;
  columns: boolean;
  title: string;
  editing: boolean;
  selected: boolean;
  position: number;
  keyboardDragging: boolean;
  onSelect: (id: string) => void;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    isDragging,
    transform,
    newIndex,
  } = useSortable({
    id: widget.id,
    disabled: !editing,
    transition: null,
  });

  return (
    <div
      ref={setNodeRef}
      style={
        keyboardDragging
          ? { transform: CSS.Transform.toString(transform), transformOrigin: "0 0" }
          : undefined
      }
      role={editing ? "group" : undefined}
      tabIndex={editing ? 0 : undefined}
      aria-label={editing ? `Виджет «${title}», позиция ${position}` : undefined}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (editing && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onSelect(widget.id);
        }
      }}
      onClick={() => editing && onSelect(widget.id)}
      className={`workspace-widget ${widget.type} ${widget.wide ? "wide" : ""} ${columns && !widget.wide && widget.column ? `col-${widget.column}` : ""} ${editing && selected ? "selected" : ""} ${isDragging ? "widget-drag-placeholder" : ""}`}
      data-widget-id={widget.id}
    >
      {editing && selected && (
        <span className="selected-label">
          <Check size={12} />
          Выбран
        </span>
      )}
      {children}
      {isDragging && (
        <span className="widget-drop-label" aria-hidden="true">
          Место для виджета
          <span>Позиция {keyboardDragging ? newIndex + 1 : position}</span>
        </span>
      )}
      {editing && (
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          className="widget-grip"
          aria-label={`Переместить виджет «${title}»`}
          aria-roledescription="Кнопка перетаскивания виджета"
          title="Перетащите за точки. С клавиатуры: Пробел, стрелки (влево/вправо — колонка), Пробел."
          onFocus={() => onSelect(widget.id)}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(widget.id);
          }}
        >
          <Grip size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function WidgetArrangement<T extends Item>({
  widgets,
  editing,
  selected,
  onSelect,
  onReorder,
  label,
  renderWidget,
  columns = false,
  children,
}: Props<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<T[] | null>(null);
  const [keyboardDragging, setKeyboardDragging] = useState(false);
  const keyboardDraggingRef = useRef(false);
  const keyboardTargetRef = useRef<string | null>(null);
  const activeIdRef = useRef<string | null>(null);
  /** Колонка, выбранная стрелками влево/вправо во время перетаскивания с клавиатуры. */
  const pendingColumnRef = useRef<1 | 2 | null>(null);
  const [columnNotice, setColumnNotice] = useState("");
  const draftRef = useRef<T[]>(widgets);
  const gridRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      scrollBehavior: "auto",
      coordinateGetter: (event, { context, currentCoordinates }) => {
        const direction = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.code];
        if (!direction) return undefined;
        event.preventDefault();
        // В двухколоночной сетке стрелки влево/вправо переносят узкий виджет в другую колонку,
        // а вверх/вниз — меняют позицию.
        const dragged = widgets.find((widget) => widget.id === activeIdRef.current);
        if (
          (event.code === "ArrowLeft" || event.code === "ArrowRight") &&
          columns &&
          dragged &&
          !dragged.wide &&
          isTwoColumns()
        ) {
          const column: 1 | 2 = event.code === "ArrowLeft" ? 1 : 2;
          pendingColumnRef.current = column;
          setDraft((current) =>
            (current ?? widgets).map((widget) =>
              widget.id === dragged.id ? { ...widget, column } : widget,
            ),
          );
          setColumnNotice(
            `Виджет «${label(dragged)}»: ${column === 1 ? "левая" : "правая"} колонка.`,
          );
          return currentCoordinates;
        }
        const index = widgets.findIndex((widget) => widget.id === keyboardTargetRef.current);
        const next = widgets[index + direction];
        if (!next) return currentCoordinates;
        keyboardTargetRef.current = next.id;
        const rect = context.droppableRects.get(next.id);
        return rect ? { x: rect.left, y: rect.top } : currentCoordinates;
      },
    }),
  );
  const isTwoColumns = () =>
    !!gridRef.current &&
    getComputedStyle(gridRef.current).gridTemplateColumns.trim().split(/\s+/).length === 2;
  const items = draft ?? widgets;
  const activeWidget = items.find((widget) => widget.id === activeId);
  const title = (id: string | number) => {
    const widget = widgets.find((item) => item.id === id);
    return widget ? label(widget) : "Виджет";
  };
  const position = (id: string | number) =>
    draftRef.current.findIndex((widget) => widget.id === id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Виджет «${title(active.id)}» взят. Позиция ${position(active.id)} из ${widgets.length}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `Виджет «${title(active.id)}»: позиция ${position(keyboardDraggingRef.current ? over.id : active.id)} из ${widgets.length}.`
        : "Вне рабочей области. Отпустите, чтобы отменить перемещение.",
    onDragEnd: ({ active, over }) =>
      over
        ? `Виджет «${title(active.id)}» перемещён на позицию ${position(active.id)} из ${widgets.length}.`
        : `Перемещение виджета «${title(active.id)}» отменено. Порядок не изменён.`,
    onDragCancel: ({ active }) =>
      `Перемещение виджета «${title(active.id)}» отменено. Порядок не изменён.`,
  };
  const collisionDetection: CollisionDetection = (args) => {
    if (!args.pointerCoordinates)
      return keyboardTargetRef.current ? [{ id: keyboardTargetRef.current }] : closestCenter(args);
    const rect = gridRef.current?.getBoundingClientRect();
    const { x, y } = args.pointerCoordinates;
    if (!rect || x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return [];
    const collisions = pointerWithin(args);
    return collisions.length ? collisions : closestCenter(args);
  };
  const reset = () => {
    activeIdRef.current = null;
    pendingColumnRef.current = null;
    setActiveId(null);
    setDraft(null);
    setKeyboardDragging(false);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "Чтобы переместить виджет, нажмите Пробел или Enter на кнопке перетаскивания. " +
            "Стрелки вверх и вниз — предыдущая и следующая позиция. " +
            "Стрелки влево и вправо — левая и правая колонка (для узких виджетов), " +
            "для широких — предыдущая и следующая позиция. " +
            "Нажмите Пробел или Enter для подтверждения, Escape для отмены. " +
            "Также можно выбрать виджет и воспользоваться кнопкой «Переставить».",
        },
      }}
      onDragStart={({ active, activatorEvent }) => {
        keyboardDraggingRef.current = activatorEvent instanceof KeyboardEvent;
        keyboardTargetRef.current = String(active.id);
        activeIdRef.current = String(active.id);
        pendingColumnRef.current = null;
        setColumnNotice("");
        setKeyboardDragging(keyboardDraggingRef.current);
        draftRef.current = [...widgets];
        setDraft(draftRef.current);
        setActiveId(String(active.id));
        onSelect(String(active.id));
      }}
      onDragOver={({ active, over }) => {
        if (keyboardDraggingRef.current) return;
        if (!over || active.id === over.id) return;
        const current = draftRef.current;
        const from = current.findIndex((widget) => widget.id === active.id);
        const to = current.findIndex((widget) => widget.id === over.id);
        if (from < 0 || to < 0 || from === to) return;
        const next = arrayMove(current, from, to);
        draftRef.current = next;
        setDraft(next);
      }}
      onDragEnd={({ active, over }) => {
        let next =
          keyboardDraggingRef.current && over
            ? arrayMove(
                widgets,
                widgets.findIndex((widget) => widget.id === active.id),
                widgets.findIndex((widget) => widget.id === over.id),
              )
            : draftRef.current;
        // Узкий виджет, отпущенный в левой или правой половине сетки, встаёт в эту колонку.
        let columnChanged = false;
        const chosen = pendingColumnRef.current;
        const target = next.find((widget) => widget.id === active.id);
        if (keyboardDraggingRef.current && over && chosen && target && target.column !== chosen) {
          columnChanged = true;
          next = next.map((widget) =>
            widget.id === active.id ? { ...widget, column: chosen } : widget,
          );
        }
        const grid = gridRef.current;
        const dropped = active.rect.current.translated;
        const moved = next.find((widget) => widget.id === active.id);
        if (
          columns &&
          over &&
          !keyboardDraggingRef.current &&
          grid &&
          dropped &&
          moved &&
          !moved.wide &&
          getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length === 2
        ) {
          const area = grid.getBoundingClientRect();
          const column: 1 | 2 = dropped.left + dropped.width / 2 < area.left + area.width / 2 ? 1 : 2;
          if (moved.column !== column) {
            columnChanged = true;
            next = next.map((widget) => (widget.id === active.id ? { ...widget, column } : widget));
          }
        }
        draftRef.current = next;
        if (over && (columnChanged || next.some((widget, index) => widget.id !== widgets[index]?.id)))
          onReorder(next);
        reset();
      }}
      onDragCancel={() => {
        pendingColumnRef.current = null;
        reset();
      }}
    >
      {/* Pointer sorting reflows mixed-width tiles; keyboard sorting keeps stable spatial targets. */}
      <SortableContext items={items} strategy={keyboardDragging ? rectSortingStrategy : () => null}>
        <div ref={gridRef} className={`widget-grid ${activeId ? "widget-grid-dragging" : ""}`}>
          {items.map((widget, index) => (
            <SortableWidget
              key={widget.id}
              widget={widget}
              title={label(widget)}
              editing={editing}
              selected={selected === widget.id}
              position={index + 1}
              keyboardDragging={keyboardDragging}
              columns={columns}
              onSelect={onSelect}
            >
              {renderWidget(widget)}
            </SortableWidget>
          ))}
          {children}
        </div>
      </SortableContext>
      <p className="visually-hidden" aria-live="assertive" aria-atomic="true">
        {columnNotice}
      </p>
      <DragOverlay dropAnimation={null}>
        {activeWidget ? (
          <div
            className={`workspace-widget ${activeWidget.type} ${activeWidget.wide ? "wide" : ""} widget-drag-overlay`}
            aria-hidden="true"
            inert
          >
            {renderWidget(activeWidget)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
