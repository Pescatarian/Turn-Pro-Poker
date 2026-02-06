import 'react-native-gesture-handler/jestSetup';

// Mock WatermelonDB
jest.mock('@nozbe/watermelondb', () => ({
    Model: class Model {
        constructor(args) { Object.assign(this, args); }
    },
    Database: class Database { },
}));
jest.mock('@nozbe/watermelondb/decorators', () => ({
    field: () => () => { },
    date: () => () => { },
    readonly: () => () => { },
    text: () => () => { },
    children: () => () => { },
    relation: () => () => { },
    json: () => () => { },
}));
