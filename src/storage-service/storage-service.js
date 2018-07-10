import { AsyncStorage } from 'react-native';
import _ from 'lodash';

const storageTenants = {
    downloader: 'DOWNLOADER',
    cache: 'CACHE'
};

function getItem(tenant, key) {
    return AsyncStorage.getItem(`${tenant}#${key}`).then(storageObjectString => {
        try {
            return JSON.parse(storageObjectString);
        } catch (e) {
            return storageObjectString;
        }
    });
}

function setItem(tenant, key, value) {
    if (typeof value === 'object') {
        value = JSON.stringify(value);
    }
    return AsyncStorage.setItem(`${tenant}#${key}`, value);
}

function removeItem(tenant, key) {
    return AsyncStorage.removeItem(`${tenant}#${key}`);
}

function getAllKeys(tenant) {
    return AsyncStorage.getAllKeys().then(keys =>
        _.map(_.filter(keys, key => _.startsWith(key, tenant)), key => key.slice(tenant.length + 1))
    );
}

function getAllKeyValuePairs(tenant) {
    return getAllKeys(tenant).then(keys => multiGet(tenant, keys));
}

function clear(tenant) {
    return getAllKeys(tenant).then(keys =>
        AsyncStorage.multiRemove(_.map(keys, key => `${tenant}#${key}`))
    );
}

function multiGet(tenant, keys) {
    return AsyncStorage.multiGet(_.map(keys, key => `${tenant}#${key}`)).then(dataList =>
        _.map(dataList, element => {
            try {
                return [element[0].slice(tenant.length + 1), JSON.parse(element[1])];
            } catch (e) {
                return [element[0].slice(tenant.length + 1), element[1]];
            }
        })
    );
}

function multiRemove(tenant, keys) {
    return AsyncStorage.multiRemove(_.map(keys, key => `${tenant}#${key}`));
}

export default {
    storageTenants,
    getItem,
    setItem,
    removeItem,
    getAllKeys,
    getAllKeyValuePairs,
    clear,
    multiGet,
    multiRemove
};
