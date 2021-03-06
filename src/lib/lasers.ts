import { Required } from "Object/_api";
import { DOWN, LEFT, RIGHT, UP } from "~/constants";
import { Direction, Entity, Pos } from "~/types";
import colors from "~colors";
import WrappedState from "~types/WrappedState";
import { createEntityFromTemplate } from "./entities";
import { getConstDir } from "./geometry";

export function createLaser(
  direction: Direction,
  strength: number,
  hit: boolean,
  pos: Pos,
): Entity {
  const color = colors.laser;

  let templateName = `LASER_${getOrientation(direction)}`;
  if (hit) {
    templateName = "LASER_BURST";
  }

  const template = createEntityFromTemplate(templateName as TemplateName, {
    pos,
  }) as Required<Entity, "display">;
  return {
    ...template,
    display: {
      ...template.display,
      color,
    },
    laser: {
      ...template.laser,
      direction: { dx: direction.dx, dy: direction.dy },
      hit,
      strength,
    },
  };
}

export function reflect(
  previousDirection: Direction,
  reflectorType: "\\" | "/",
  strength: number,
): { direction: Direction; cosmeticTemplate: TemplateName } {
  const constPrevDir = getConstDir(previousDirection);
  let newDirection = constPrevDir;
  if (reflectorType === "\\") {
    if (constPrevDir === RIGHT) newDirection = DOWN;
    if (constPrevDir === DOWN) newDirection = RIGHT;
    if (constPrevDir === LEFT) newDirection = UP;
    if (constPrevDir === UP) newDirection = LEFT;
  } else {
    if (constPrevDir === RIGHT) newDirection = UP;
    if (constPrevDir === DOWN) newDirection = LEFT;
    if (constPrevDir === LEFT) newDirection = DOWN;
    if (constPrevDir === UP) newDirection = RIGHT;
  }
  const cosmeticTemplate = getReflectedTemplateName(
    strength,
    previousDirection,
    newDirection,
  );
  return { direction: newDirection, cosmeticTemplate };
}

export function getSplitTemplateName(
  strength: number,
  direction: Direction,
  splitterType: string,
): TemplateName {
  if (splitterType === "advanced") {
    return "LASER_4SPLIT";
  }
  return `LASER_SPLIT_${getSplitOrientation(direction)}` as TemplateName;
}

function getReflectedTemplateName(
  strength: number,
  from: Direction,
  to: Direction,
): TemplateName {
  return `LASER_REFLECTED_${getReflectedOrientation(from, to)}` as TemplateName;
}

function getOrientation(direction: Direction) {
  const constDir = getConstDir(direction);
  if (constDir === UP || constDir === DOWN) {
    return "VERTICAL";
  } else {
    return "HORIZONTAL";
  }
}

function getReflectedOrientation(from: Direction, to: Direction) {
  const constFrom = getConstDir(from);
  const constTo = getConstDir(to);
  if (
    (constFrom === DOWN && constTo === LEFT) ||
    (constTo === UP && constFrom === RIGHT)
  ) {
    return "UP_LEFT";
  }
  if (
    (constFrom === DOWN && constTo === RIGHT) ||
    (constTo === UP && constFrom === LEFT)
  ) {
    return "UP_RIGHT";
  }
  if (
    (constFrom === UP && constTo === LEFT) ||
    (constTo === DOWN && constFrom === RIGHT)
  ) {
    return "DOWN_LEFT";
  }
  if (
    (constFrom === UP && constTo === RIGHT) ||
    (constTo === DOWN && constFrom === LEFT)
  ) {
    return "DOWN_RIGHT";
  }
  return "";
}

function getSplitOrientation(direction: Direction) {
  const constDir = getConstDir(direction);
  if (constDir === UP) return "UP";
  if (constDir === DOWN) return "DOWN";
  if (constDir === LEFT) return "LEFT";
  return "RIGHT";
}

export function retargetLaserOnReflectorChange(state: WrappedState, pos?: Pos) {
  if (state.select.isWeaponActive()) {
    if (pos) {
      const entitiesAtPos = state.select.entitiesAtPosition(pos);
      if (entitiesAtPos.some((e) => e.laser)) {
        state.act.targetWeapon(state.select.lastAimingDirection());
      }
    } else {
      state.act.targetWeapon(state.select.lastAimingDirection());
    }
  }
}
