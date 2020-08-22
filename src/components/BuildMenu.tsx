import Tooltip from "rc-tooltip";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import buildingCategories, { BuildingCategory } from "~data/buildingCategories";
import buildings from "~data/buildings";
import controls, { ControlCode } from "~data/controls";
import templates from "~data/templates";
import { useControl } from "~hooks";
import actions from "~state/actions";
import selectors from "~state/selectors";
import ResourceAmount from "./ResourceAmount";

export default function BuildMenu() {
  const dispatch = useDispatch();
  const cursorPos = useSelector(selectors.cursorPos);
  const [category, setCategory] = useState<BuildingCategory | null>(null);
  const categoryBuildings = category
    ? buildings.filter((b) => b.category === category.code)
    : [];
  const placingTarget = useSelector(selectors.placingTarget);

  const cancel = () => {
    setCategory(null);
    dispatch(actions.cancelPlacement());
  };
  const rotate = () => {
    if (placingTarget && placingTarget.rotatable) {
      dispatch(actions.rotateEntity(placingTarget));
    }
  };

  useControl(ControlCode.Back, cancel);
  useControl(
    ControlCode.RotateBuilding,
    rotate,
    Boolean(placingTarget && placingTarget.rotatable),
  );
  const makeBuildingCallback = (n: number) => () => {
    if (categoryBuildings.length) {
      dispatch(
        actions.activatePlacement({
          ...categoryBuildings[n - 1],
          pos: cursorPos || undefined,
          takesTurn: true,
        }),
      );
    } else {
      setCategory(buildingCategories[n - 1]);
    }
  };
  useControl(ControlCode.Building1, makeBuildingCallback(1), !placingTarget);
  useControl(ControlCode.Building2, makeBuildingCallback(2), !placingTarget);
  useControl(ControlCode.Building3, makeBuildingCallback(3), !placingTarget);
  useControl(ControlCode.Building4, makeBuildingCallback(4), !placingTarget);
  useControl(ControlCode.Building5, makeBuildingCallback(5), !placingTarget);
  useControl(ControlCode.Building6, makeBuildingCallback(6), !placingTarget);
  useControl(ControlCode.Building7, makeBuildingCallback(7), !placingTarget);
  useControl(ControlCode.Building8, makeBuildingCallback(8), !placingTarget);
  useControl(ControlCode.Building9, makeBuildingCallback(9), !placingTarget);
  useControl(ControlCode.Building0, makeBuildingCallback(0), !placingTarget);

  const showCategory: boolean = !category;
  const showBuildings: boolean = Boolean(category && !placingTarget);

  const buttonStyle: React.CSSProperties = { margin: "-1px -1px -1px 0" };
  const buttonClassName =
    "font-normal border border-gray hover:border-white hover:z-10 px-2 py-1 flex flex-row items-center";
  return (
    <section className="border-t border-b border-gray flex flex-row">
      {placingTarget && placingTarget.description ? (
        <h2 className="text-xl px-2">
          Buidling {placingTarget.description.name}
        </h2>
      ) : null}
      {category ? (
        <button
          type="button"
          onClick={cancel}
          style={buttonStyle}
          className={buttonClassName}
        >
          <kbd className="bg-darkGray px-1 rounded mr-1">
            {controls[ControlCode.Back][0]}
          </kbd>
          Cancel
        </button>
      ) : (
        <h2 className="text-xl px-2">Build</h2>
      )}
      {placingTarget && placingTarget.rotatable ? (
        <button
          type="button"
          onClick={rotate}
          style={buttonStyle}
          className={buttonClassName}
        >
          <kbd className="bg-darkGray px-1 rounded mr-1">r</kbd>
          Rotate
        </button>
      ) : null}
      {showBuildings &&
        categoryBuildings.map((b, i) => (
          <Tooltip
            key={b.template}
            placement="top"
            overlayStyle={{ width: "10rem" }}
            overlay={
              <span>
                {
                  (
                    templates[b.template].description || {
                      description: "No description",
                    }
                  ).description
                }
              </span>
            }
          >
            <button
              type="button"
              onClick={() =>
                dispatch(
                  actions.activatePlacement({
                    ...b,
                    pos: cursorPos || undefined,
                    takesTurn: true,
                  }),
                )
              }
              style={buttonStyle}
              className={buttonClassName}
            >
              <kbd className="bg-darkGray px-1 rounded mr-1">{i + 1}</kbd>
              {b.label}
              <ResourceAmount
                className="ml-1"
                resourceCode={b.cost.resource}
                amount={b.cost.amount}
              />
            </button>
          </Tooltip>
        ))}
      {showCategory &&
        buildingCategories.map((c, i) => (
          <button
            key={c.code}
            type="button"
            onClick={() => setCategory(c)}
            style={buttonStyle}
            className={buttonClassName}
          >
            <kbd className="bg-darkGray px-1 rounded mr-1">{i + 1}</kbd>
            {c.label}
          </button>
        ))}
    </section>
  );
}
