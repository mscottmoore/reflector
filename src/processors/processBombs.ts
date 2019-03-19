import * as actions from "../actions";
import { attack } from "../handlers/attack";
import { removeEntity } from "../handlers/removeEntity";
import { updateEntity } from "../handlers/updateEntity";
import * as selectors from "../selectors";
import { GameState } from "../types";
import { getAdjacentPositions } from "../utils";

export default function processBombs(state: GameState): GameState {
  for (let entity of selectors.entityList(state)) {
    if (entity.bomb && entity.position) {
      if (entity.bomb.time <= 0 && entity) {
        state = removeEntity(
          state,
          actions.removeEntity({ entityId: entity.id }),
        );
        for (let pos of getAdjacentPositions(entity.position)) {
          for (let e of selectors.entitiesAtPosition(state, pos)) {
            if (e.hitPoints || e.destructible) {
              state = attack(
                state,
                actions.attack({
                  target: e.id,
                  message: "You are caught in the bomb's explosion!",
                }),
              );
            }
          }
        }
      } else {
        state = updateEntity(
          state,
          actions.updateEntity({
            id: entity.id,
            bomb: { time: entity.bomb.time - 1 },
          }),
        );
      }
    }
  }
  return state;
}
