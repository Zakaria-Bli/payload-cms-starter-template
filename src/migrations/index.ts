import * as migration_20261115_090104_initial from './20261115_090104_initial';

export const migrations = [
  {
    up: migration_20261115_090104_initial.up,
    down: migration_20261115_090104_initial.down,
    name: '20261115_090104_initial'
  },
];
