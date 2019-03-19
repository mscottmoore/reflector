import * as actions from "../actions";
import { activateEquip } from "../handlers/activateEquip";
import { removeEntity } from "../handlers/removeEntity";
import { updateEntity } from "../handlers/updateEntity";
import * as selectors from "../selectors";
import { GameState } from "../types";
import { isPosEqual } from "../utils";

export default function processPickups(state: GameState): GameState {
  const player = selectors.player(state);
  for (let entity of selectors.entityList(state)) {
    if (
      player &&
      player.position &&
      entity.pickup &&
      entity.position &&
      isPosEqual(player.position, entity.position)
    ) {
      if (entity.pickup.effect === "NONE") {
        state = removeEntity(
          state,
          actions.removeEntity({ entityId: entity.id }),
        );
      }
      if (entity.pickup.effect === "PICKUP") {
        state = removeEntity(
          state,
          actions.removeEntity({ entityId: entity.id }),
        );
        if (player.inventory) {
          state = updateEntity(
            state,
            actions.updateEntity({
              id: player.id,
              inventory: {
                reflectors:
                  player.inventory.reflectors + (entity.reflector ? 1 : 0),
                splitters:
                  player.inventory.splitters + (entity.splitter ? 1 : 0),
              },
            }),
          );
        }
      }
      if (entity.pickup.effect === "HEAL") {
        state = removeEntity(
          state,
          actions.removeEntity({ entityId: entity.id }),
        );
        if (
          player.hitPoints &&
          player.hitPoints.current < player.hitPoints.max
        ) {
          state = updateEntity(
            state,
            actions.updateEntity({
              id: player.id,
              hitPoints: {
                ...player.hitPoints,
                current: player.hitPoints.current + 1,
              },
            }),
          );
          state = {
            ...state,
            messageLog: [...state.messageLog, "You heal 1."],
          };
        }
      }
      if (entity.pickup.effect === "RECHARGE") {
        state = removeEntity(
          state,
          actions.removeEntity({ entityId: entity.id }),
        );
        state = {
          ...state,
          messageLog: [...state.messageLog, "All weapons ready."],
        };
        for (let weapon of selectors.weapons(state)) {
          if (weapon.weapon && weapon.weapon.readyIn) {
            state = updateEntity(
              state,
              actions.updateEntity({
                id: weapon.id,
                weapon: { ...weapon.weapon, readyIn: 0 },
              }),
            );
          }
        }
      }
      if (entity.pickup.effect === "EQUIP") {
        if (entity.weapon) {
          state = activateEquip(state, actions.activateEquip({ entity }));
        }
      }
    }
  }
  return state;
}
