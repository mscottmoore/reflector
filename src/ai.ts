import * as ROT from "rot-js";
import { ActionType } from "typesafe-actions";
import * as actions from "./actions";
import {
  ANGLER_RANGE,
  BOMBER_COOLDOWN,
  BOMBER_RANGE,
  PLAYER_ID,
} from "./constants";
import * as selectors from "./selectors";
import { createEntityFromTemplate } from "./templates";
import { Direction, Entity, GameState, Position } from "./types";
import {
  getAdjacentPositions,
  getClosestPosition,
  getDistance,
  isPosEqual,
} from "./utils";

const aiActions = {
  move: actions.move,
  attack: actions.attack,
  addEntity: actions.addEntity,
  updateEntity: actions.updateEntity,
};
type AIAction = ActionType<typeof aiActions>;

function isPassable(gameState: GameState, position: Position) {
  return selectors
    .entitiesAtPosition(gameState, position)
    .every(entity => !entity.blocking || !entity.blocking.moving);
}

function isDestructibleNonEnemy(gameState: GameState, position: Position) {
  return selectors
    .entitiesAtPosition(gameState, position)
    .every(entity =>
      Boolean(
        !entity.blocking ||
          !entity.blocking.moving ||
          (entity.destructible && !entity.ai),
      ),
    );
}

function moveToward(gameState: GameState, entity: Entity, to: Position) {
  if (!entity.position) return [];
  const direction = getDirectionTowardTarget(entity.position, to, gameState);
  if (!direction) return [];
  return [actions.move({ entityId: entity.id, ...direction })];
}

function getDirectionTowardTarget(
  from: Position,
  to: Position,
  gameState: GameState,
  passableFunc = isPassable,
): Direction | null {
  const passable = (x: number, y: number) =>
    (x === from.x && y === from.y) ||
    (x === to.x && y === to.y) ||
    passableFunc(gameState, { x, y });
  const path: Position[] = [];
  const aStar = new ROT.Path.AStar(to.x, to.y, passable);
  aStar.compute(from.x, from.y, (x, y) => {
    const pos = { x, y };
    if (!isPosEqual(pos, from)) {
      path.push(pos);
    }
  });
  if (path.length) {
    return { dx: path[0].x - from.x, dy: path[0].y - from.y };
  }
  return null;
}

export function getAIActions(entity: Entity, gameState: GameState): AIAction[] {
  const ai = entity.ai;
  if (!ai) return [];
  const player = selectors.player(gameState);

  if (ai.type === "RUSHER") {
    if (!player || !player.position || !entity.position) {
      return [];
    }
    if (getDistance(entity.position, player.position) <= 1) {
      return [
        actions.attack({
          target: player.id,
          message: "The Rusher attacks you!",
        }),
      ];
    }
    const direction = getDirectionTowardTarget(
      entity.position,
      player.position,
      gameState,
      isDestructibleNonEnemy,
    );
    if (!direction) return [];
    const targetPos = {
      x: entity.position.x + direction.dx,
      y: entity.position.y + direction.dy,
    };
    const entitiesAtTargetPos = selectors.entitiesAtPosition(
      gameState,
      targetPos,
    );
    const destructibleAtTargetPos = entitiesAtTargetPos.find(
      e => !!e.destructible,
    );
    if (destructibleAtTargetPos) {
      return [
        actions.attack({
          target: destructibleAtTargetPos.id,
          message: "The Rusher attacks you!",
        }),
      ];
    } else {
      return [actions.move({ entityId: entity.id, ...direction })];
    }
  }

  if (ai.type === "SMASHER") {
    if (!entity.position) return [];
    const reflectorsAndSplittersAndPlayer = selectors
      .entityList(gameState)
      .filter(e => e.reflector || e.splitter || e.id === PLAYER_ID);

    const adjacent = reflectorsAndSplittersAndPlayer.find(
      e =>
        !!(
          e.position &&
          entity.position &&
          getDistance(e.position, entity.position) <= 1
        ),
    );
    if (adjacent) {
      return [
        actions.attack({
          target: adjacent.id,
          message: "The Smasher attacks you!",
        }),
      ];
    }

    const closest = reflectorsAndSplittersAndPlayer.sort((a, b) => {
      const aDistance =
        a.position && entity.position
          ? getDistance(a.position, entity.position)
          : Infinity;
      const bDistance =
        b.position && entity.position
          ? getDistance(b.position, entity.position)
          : Infinity;
      return aDistance - bDistance;
    })[0];
    if (closest) {
      if (!closest.position) return [];
      return moveToward(gameState, entity, closest.position);
    }
  }

  if (ai.type === "ANGLER") {
    if (!player || !player.position || !entity.position) return [];
    const playerPos = player.position;
    const entityPos = entity.position;
    if (getDistance(playerPos, entityPos) > ANGLER_RANGE * 2) {
      return moveToward(gameState, entity, playerPos);
    }

    const possiblePositions: Position[] = [];
    for (let delta = 1; delta <= ANGLER_RANGE; delta++) {
      possiblePositions.push({
        x: playerPos.x + delta,
        y: playerPos.y + delta,
      });
      possiblePositions.push({
        x: playerPos.x + delta,
        y: playerPos.y - delta,
      });
      possiblePositions.push({
        x: playerPos.x - delta,
        y: playerPos.y - delta,
      });
      possiblePositions.push({
        x: playerPos.x - delta,
        y: playerPos.y + delta,
      });
    }
    const attackablePositions = possiblePositions.filter(pos => {
      let dx = pos.x - playerPos.x;
      let dy = pos.y - playerPos.y;
      let dxSign = dx > 0 ? 1 : -1;
      let dySign = dy > 0 ? 1 : -1;
      if (dx === 0) return false;
      dx = (Math.abs(dx) - 1) * dxSign;
      dy = (Math.abs(dy) - 1) * dySign;
      while (dx !== 0) {
        const intermediatePos = { x: playerPos.x + dx, y: playerPos.y + dy };
        if (!isPassable(gameState, intermediatePos)) {
          return false;
        }
        dx = (Math.abs(dx) - 1) * dxSign;
        dy = (Math.abs(dy) - 1) * dySign;
      }
      return true;
    });
    if (attackablePositions.some(pos => isPosEqual(pos, entityPos))) {
      return [
        actions.attack({
          target: PLAYER_ID,
          message: "The Angler attacks you!",
        }),
      ];
    }
    const passableAttackablePosition = attackablePositions.filter(pos =>
      isPassable(gameState, pos),
    );
    const closest = getClosestPosition(passableAttackablePosition, entityPos);
    if (!closest) return [];
    return moveToward(gameState, entity, closest);
  }

  if (ai.type === "BOMBER") {
    if (!player || !player.position || !entity.position) return [];
    const playerPos = player.position;
    const entityPos = entity.position;
    if (getDistance(playerPos, entityPos) > BOMBER_RANGE) {
      return moveToward(gameState, entity, playerPos);
    }

    const { cooldown } = entity;
    if (!cooldown || cooldown.time)
      return moveToward(gameState, entity, playerPos);

    const possiblePositions = getAdjacentPositions(playerPos)
      .filter(pos => isPassable(gameState, pos))
      .filter(pos => getDistance(entityPos, pos) <= BOMBER_RANGE)
      .filter(pos => getDistance(entityPos, pos) > 1);
    if (!possiblePositions.length)
      return moveToward(gameState, entity, playerPos);
    const target = possiblePositions.sort((a, b) => {
      const aNumAdjacentAIs = getAdjacentPositions(a).filter(pos =>
        selectors.entitiesAtPosition(gameState, pos).some(e => !!e.ai),
      ).length;
      const bNumAdjacentAIs = getAdjacentPositions(b).filter(pos =>
        selectors.entitiesAtPosition(gameState, pos).some(e => !!e.ai),
      ).length;
      return aNumAdjacentAIs - bNumAdjacentAIs;
    })[0];
    return [
      actions.addEntity({
        entity: createEntityFromTemplate("BOMB", { position: target }),
      }),
      actions.updateEntity({
        id: entity.id,
        cooldown: { time: BOMBER_COOLDOWN + 1 },
      }),
    ];
  }

  return [];
}
