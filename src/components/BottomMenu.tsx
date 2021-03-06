/* global document */
import Tippy from "@tippyjs/react";
import React, { useCallback, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  HotkeyGroup,
  useControl,
  ControlConfig,
} from "~components/HotkeysProvider";
import { SettingsContext } from "~contexts";
import buildingCategories, { BuildingCategory } from "~data/buildingCategories";
import { useBoolean } from "~hooks";
import actions from "~state/actions";
import selectors from "~state/selectors";
import { ControlCode } from "~types/ControlCode";
import { noFocusOnClick } from "~lib/controls";
import { createEntityFromTemplate } from "~lib/entities";
import notifications from "~lib/notifications";
import EntityPreview from "./EntityPreview";
import Icons from "./Icons";
import Kbd from "./Kbd";
import ResourceAmount from "./ResourceAmount";

const buttonStyle: React.CSSProperties = { margin: "-1px -1px -1px 0" };
const buttonClassName =
  "font-normal border border-gray hover:border-white z-10 hover:z-20 px-2 py-1 flex flex-row items-center";

export default function BottomMenu() {
  const dispatch = useDispatch();
  const blueprint = useSelector(selectors.blueprint);
  const isWeaponActive = useSelector(selectors.isWeaponActive);
  const settings = useContext(SettingsContext);

  const cancel = useCallback(() => {
    dispatch(actions.blueprintCancel());
  }, []);
  const rotate = useCallback(() => {
    if (blueprint && blueprint.rotatable) {
      dispatch(actions.rotateEntity(blueprint));
    }
  }, [blueprint]);

  useEffect(() => {
    if (blueprint) {
      const listener = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        cancel();
      };
      document.addEventListener("contextmenu", listener, true);
      return () => document.removeEventListener("contextmenu", listener, true);
    } else {
      return () => {};
    }
  });

  // cancel build when laser activated
  useEffect(() => {
    if (isWeaponActive) {
      cancel();
    }
  }, [isWeaponActive]);

  useControl({
    code: ControlCode.Back,
    callback: cancel,
    group: HotkeyGroup.Main,
  });
  useControl({
    code: ControlCode.RotateBuilding,
    group: HotkeyGroup.Main,
    callback: rotate,
    disabled: !(blueprint && blueprint.rotatable),
  });
  const makeBuildingCallback = (n: number) => () => {
    if (isWeaponActive) {
      // cancel laser when initiating build
      dispatch(actions.deactivateWeapon());
    }
  };
  useControl({
    code: ControlCode.Menu1,
    group: HotkeyGroup.Main,
    callback: makeBuildingCallback(1),
    disabled: Boolean(blueprint),
  });
  useControl({
    code: ControlCode.Menu2,
    group: HotkeyGroup.Main,
    callback: makeBuildingCallback(2),
    disabled: Boolean(blueprint),
  });
  useControl({
    code: ControlCode.Menu3,
    group: HotkeyGroup.Main,
    callback: makeBuildingCallback(3),
    disabled: Boolean(blueprint),
  });
  useControl({
    code: ControlCode.Menu4,
    group: HotkeyGroup.Main,
    callback: makeBuildingCallback(4),
    disabled: Boolean(blueprint),
  });
  useControl({
    code: ControlCode.Menu5,
    group: HotkeyGroup.Main,
    callback: makeBuildingCallback(5),
    disabled: Boolean(blueprint),
  });
  useControl({
    code: ControlCode.Menu6,
    group: HotkeyGroup.Main,
    callback: makeBuildingCallback(6),
    disabled: Boolean(blueprint),
  });
  useControl({
    code: ControlCode.Menu7,
    group: HotkeyGroup.Main,
    callback: makeBuildingCallback(7),
    disabled: Boolean(blueprint),
  });
  useControl({
    code: ControlCode.Menu8,
    group: HotkeyGroup.Main,
    callback: makeBuildingCallback(8),
    disabled: Boolean(blueprint),
  });
  useControl({
    code: ControlCode.Menu9,
    group: HotkeyGroup.Main,
    callback: makeBuildingCallback(9),
    disabled: Boolean(blueprint),
  });
  useControl({
    code: ControlCode.Menu0,
    group: HotkeyGroup.Main,
    callback: makeBuildingCallback(0),
    disabled: Boolean(blueprint),
  });

  return (
    <section
      className="border-t border-b border-gray flex flex-row"
      data-section="BOTTOM_MENU"
    >
      {blueprint ? (
        <h2 className="text-xl px-2 self-center">
          Building{" "}
          {
            (createEntityFromTemplate(blueprint.template).description || {})
              .name
          }
          <span className="text-base ml-2">
            {blueprint.blueprint &&
            blueprint.blueprint.cost &&
            blueprint.blueprint.cost.amount ? (
              <ResourceAmount
                resourceCode={blueprint.blueprint.cost.resource}
                amount={blueprint.blueprint.cost.amount}
              />
            ) : (
              <span className="text-lightGray">Free</span>
            )}
          </span>
        </h2>
      ) : null}
      {!blueprint && <h2 className="text-xl px-2 self-center">Build</h2>}
      {blueprint && blueprint.rotatable ? (
        <button
          type="button"
          onClick={noFocusOnClick(rotate)}
          style={buttonStyle}
          className={buttonClassName}
        >
          <kbd className="bg-darkGray px-1 rounded mr-1">
            {settings.keyboardShortcuts[ControlCode.RotateBuilding][0]}
          </kbd>
          Rotate
        </button>
      ) : null}
      {blueprint ? (
        <button
          type="button"
          onClick={noFocusOnClick(cancel)}
          style={buttonStyle}
          className={buttonClassName}
          data-control-code={ControlCode.Back}
        >
          <kbd className="bg-darkGray px-1 rounded mr-1">
            {settings.keyboardShortcuts[ControlCode.Back][0]}
          </kbd>
          Cancel
        </button>
      ) : null}
      {!blueprint &&
        buildingCategories.map((c, i) => (
          <BuildingCategoryMenu key={c.code} category={c} index={i} />
        ))}
      <div className="flex-1" />
      <IconButton
        label="Clear All Reflectors"
        controlCode={ControlCode.ClearAllReflectors}
        callback={() => dispatch(actions.clearReflectors())}
        icon={<Icons.ClearReflectors />}
      />
      <IconButton
        label="Wait/Skip Turn"
        controlCode={ControlCode.Wait}
        callback={() => dispatch(actions.playerTookTurn())}
        icon={<Icons.Wait />}
        controlConfig={{ ctrl: false }}
      />
      <IconButton
        label="Undo Turn"
        controlCode={ControlCode.Undo}
        callback={() => dispatch(actions.undoTurn())}
        icon={<Icons.Undo />}
      />
      <IconButton
        label="Dismiss Notifications"
        controlCode={ControlCode.DismissNotifications}
        callback={() => notifications.dismissAll()}
        icon={<Icons.DismissNotifications />}
      />
    </section>
  );
}

function IconButton({
  label,
  controlCode,
  callback,
  icon,
  controlConfig = {},
}: {
  label: string;
  controlCode: ControlCode;
  callback: () => void;
  icon: React.ReactElement;
  controlConfig?: Partial<ControlConfig>;
}) {
  const settings = useContext(SettingsContext);
  useControl({
    code: controlCode,
    callback,
    group: HotkeyGroup.Main,
    ...controlConfig,
  });
  return (
    <Tippy content={`${label} (${settings.keyboardShortcuts[controlCode][0]})`}>
      <button
        type="button"
        className="w-6 p-0.5"
        onClick={noFocusOnClick(callback)}
        data-control-code={controlCode}
      >
        {icon}
      </button>
    </Tippy>
  );
}

function BuildingCategoryMenu({
  category,
  index,
}: {
  category: BuildingCategory;
  index: number;
}) {
  const settings = useContext(SettingsContext);
  const dispatch = useDispatch();
  const [isOpen, open, close, toggle] = useBoolean(false);

  const deactivateWeaponAndToggle = useCallback(() => {
    dispatch(actions.deactivateWeapon());
    toggle();
  }, []);

  const deactivateWeaponAndOpen = useCallback(() => {
    dispatch(actions.deactivateWeapon());
    open();
  }, []);

  const controlCode = [
    ControlCode.Menu1,
    ControlCode.Menu2,
    ControlCode.Menu3,
    ControlCode.Menu4,
    ControlCode.Menu5,
    ControlCode.Menu6,
    ControlCode.Menu7,
    ControlCode.Menu8,
    ControlCode.Menu9,
    ControlCode.Menu0,
  ][index];

  useControl({
    code: controlCode,
    callback: deactivateWeaponAndOpen,
    group: HotkeyGroup.Main,
  });

  useControl({
    code: ControlCode.Back,
    callback: close,
    group: HotkeyGroup.BuildingSelection,
    disabled: !isOpen,
  });

  return (
    <Tippy
      placement="top"
      visible={isOpen}
      onClickOutside={close}
      arrow={false}
      interactive
      content={
        isOpen ? (
          <div>
            {category.blueprints.map((blueprintTemplate, i) => {
              return (
                <BuildingButton
                  key={blueprintTemplate}
                  template={blueprintTemplate}
                  index={i}
                  callback={() => {
                    close();
                    dispatch(actions.blueprintSelect(blueprintTemplate));
                  }}
                />
              );
            })}
            <button
              style={{ marginTop: 1 }}
              type="button"
              onClick={noFocusOnClick(close)}
            >
              <Kbd light>{settings.keyboardShortcuts[ControlCode.Back][0]}</Kbd>{" "}
              Close
            </button>
          </div>
        ) : null
      }
    >
      <Tippy placement="top" content={category.description} disabled={isOpen}>
        <button
          data-building-category={category.code}
          type="button"
          onClick={noFocusOnClick(deactivateWeaponAndToggle)}
          style={buttonStyle}
          className={buttonClassName}
        >
          <Kbd className="text-xs mr-1 pt-0">
            {settings.keyboardShortcuts[controlCode][0]}
          </Kbd>
          {category.label}
        </button>
      </Tippy>
    </Tippy>
  );
}

function BuildingButton({
  template,
  index,
  callback,
}: {
  template: TemplateName;
  index: number;
  callback: () => void;
}) {
  const settings = useContext(SettingsContext);
  const controlCode = [
    ControlCode.Menu1,
    ControlCode.Menu2,
    ControlCode.Menu3,
    ControlCode.Menu4,
    ControlCode.Menu5,
    ControlCode.Menu6,
    ControlCode.Menu7,
    ControlCode.Menu8,
    ControlCode.Menu9,
    ControlCode.Menu0,
  ][index];
  useControl({
    code: controlCode,
    callback,
    group: HotkeyGroup.BuildingSelection,
  });

  const blueprint = createEntityFromTemplate(template);
  const blueprintBuilds = blueprint.blueprint
    ? blueprint.blueprint.builds
    : "NONE";
  return (
    <Tippy
      placement="right"
      offset={[0, 15]}
      content={blueprint.description ? blueprint.description.description : ""}
    >
      <button
        data-building={blueprintBuilds}
        type="button"
        className="flex flex-no-wrap items-baseline w-full text-left mb-1"
        onClick={noFocusOnClick(callback)}
      >
        <Kbd light>{settings.keyboardShortcuts[controlCode][0]}</Kbd>
        <span className="flex-1 ml-1 mr-3 inline-block">
          <EntityPreview templateName={blueprintBuilds} />{" "}
          {` ${blueprint.description ? blueprint.description.name : template}`}
        </span>
        {blueprint.blueprint && blueprint.blueprint.cost.amount ? (
          <ResourceAmount
            resourceCode={blueprint.blueprint.cost.resource}
            amount={blueprint.blueprint.cost.amount}
          />
        ) : (
          <span className="text-lightGray">Free</span>
        )}
      </button>
    </Tippy>
  );
}
