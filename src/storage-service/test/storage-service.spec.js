import { AsyncStorage } from 'react-native';
import _ from 'lodash';

import storageService from '../storage-service';

describe('storageService - Unit Test', () => {
    const mockString = 'I am a string';
    const mockData = {
        some: 'json',
        object: 'with',
        data: 10
    };
    const mockKeys = ['DOWNLOADER#key1', 'DOWNLOADER#key2', 'CACHE#key1', 'CACHE#key2'];

    const mockDownloaderKeyValuePairs = [
        ['DOWNLOADER#key1', mockString],
        ['DOWNLOADER#key2', mockString]
    ];

    const mockDataList = [
        ['DOWNLOADER#key1', JSON.stringify(mockData)],
        ['DOWNLOADER#key2', JSON.stringify(mockData)],
        ['CACHE#key1', JSON.stringify(mockData)],
        ['CACHE#key2', JSON.stringify(mockData)]
    ];

    let downloader, cache;
    beforeEach(() => {
        storageService.clearStorageTenants();
        storageService.addStorageTenant('downloader');
        storageService.addStorageTenant('cache');
        downloader = storageService.getStorageTenant('downloader');
        cache = storageService.getStorageTenant('cache');
        AsyncStorage.getItem = jest
            .fn()
            .mockImplementation(() => Promise.resolve(JSON.stringify(mockData)))
            .mockName('AsyncStorage.getItem');
        AsyncStorage.setItem = jest
            .fn()
            .mockImplementation(() => Promise.resolve())
            .mockName('AsyncStorage.setItem');
        AsyncStorage.removeItem = jest
            .fn()
            .mockImplementation(() => Promise.resolve())
            .mockName('AsyncStorage.removeItem');
        AsyncStorage.getAllKeys = jest
            .fn()
            .mockImplementation(() => Promise.resolve(mockKeys))
            .mockName('AsyncStorage.getAllKeys');
        AsyncStorage.multiGet = jest
            .fn()
            .mockImplementation(keys =>
                Promise.resolve(
                    _.filter(mockDataList, keyValuePair => _.indexOf(keys, keyValuePair[0]) !== -1)
                )
            )
            .mockName('AsyncStorage.multiGet');
        AsyncStorage.multiRemove = jest
            .fn()
            .mockImplementation(() => Promise.resolve())
            .mockName('AsyncStorage.multiRemove');
    });

    describe('getItem', () => {
        it("should return an object if the stored item is JSON from a tenant's storage", done => {
            storageService.getItem(downloader, 'key1').then(data => {
                expect(data).toEqual(mockData);
                expect(AsyncStorage.getItem).toHaveBeenCalledWith('DOWNLOADER#key1');
                expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
                done();
            });
        });

        it("should return a string if stored item is not JSON from a tenant's storage", done => {
            AsyncStorage.getItem.mockImplementation(() => Promise.resolve(mockString));

            storageService.getItem(cache, 'key1').then(data => {
                expect(data).toEqual(mockString);
                expect(AsyncStorage.getItem).toHaveBeenCalledWith('CACHE#key1');
                expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
                done();
            });
        });

        it('should not swallow exceptions', done => {
            AsyncStorage.getItem.mockImplementation(() => Promise.reject(null));

            storageService.getItem(downloader, 'key1').catch(error => {
                expect(error).toBeNull();
                done();
            });
        });
    });

    describe('setItem', () => {
        it("should convert value to JSON if it's an object and store it in a tenant's storage", done => {
            storageService.setItem(downloader, 'key1', mockData).then(() => {
                expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                    'DOWNLOADER#key1',
                    JSON.stringify(mockData)
                );
                expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
                done();
            });
        });

        it("should just store the given string in a tenant's storage", done => {
            storageService.setItem(cache, 'key1', mockString).then(() => {
                expect(AsyncStorage.setItem).toHaveBeenCalledWith('CACHE#key1', mockString);
                expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
                done();
            });
        });

        it('should not swallow exceptions', done => {
            AsyncStorage.setItem.mockImplementation(() => Promise.reject(null));

            storageService.setItem(downloader, 'key1', mockData).catch(error => {
                expect(error).toBeNull();
                done();
            });
        });
    });

    describe('removeItem', () => {
        it("should remove an item from a tenant's storage", done => {
            storageService.removeItem(downloader, 'key1').then(() => {
                expect(AsyncStorage.removeItem).toHaveBeenCalledWith('DOWNLOADER#key1');
                expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(1);
                done();
            });
        });

        it('should not swallow exceptions', done => {
            AsyncStorage.removeItem.mockImplementation(() => Promise.reject(null));

            storageService.removeItem(downloader, 'key1').catch(error => {
                expect(error).toBeNull();
                done();
            });
        });
    });

    describe('getAllKeys', () => {
        it('should get all keys for a given tenant', done => {
            storageService.getAllKeys(downloader).then(data => {
                expect(data).toEqual(['key1', 'key2']);
                expect(AsyncStorage.getAllKeys).toHaveBeenCalledTimes(1);
                done();
            });
        });

        it('should not swallow exceptions', done => {
            AsyncStorage.getAllKeys.mockImplementation(() => Promise.reject(null));

            storageService.getAllKeys(downloader).catch(error => {
                expect(error).toBeNull();
                done();
            });
        });
    });

    describe('multiGet', () => {
        it('should get all objects if value is JSON for a tenant given an array of keys', done => {
            storageService.multiGet(cache, ['key1', 'key2']).then(data => {
                expect(data).toEqual([['key1', mockData], ['key2', mockData]]);
                expect(AsyncStorage.multiGet).toHaveBeenCalledWith(['CACHE#key1', 'CACHE#key2']);
                expect(AsyncStorage.multiGet).toHaveBeenCalledTimes(1);
                done();
            });
        });

        it('should get all strings if value is not JSON for a tenant given an array of keys', done => {
            AsyncStorage.multiGet.mockImplementation(keys =>
                Promise.resolve(
                    _.filter(
                        mockDownloaderKeyValuePairs,
                        keyValuePair => _.indexOf(keys, keyValuePair[0]) !== -1
                    )
                )
            );

            storageService.multiGet(downloader, ['key1', 'key2']).then(data => {
                expect(data).toEqual([['key1', mockString], ['key2', mockString]]);
                expect(AsyncStorage.multiGet).toHaveBeenCalledWith([
                    'DOWNLOADER#key1',
                    'DOWNLOADER#key2'
                ]);
                expect(AsyncStorage.multiGet).toHaveBeenCalledTimes(1);
                done();
            });
        });

        it('should not swallow exceptions', done => {
            AsyncStorage.multiGet.mockImplementation(() => Promise.reject(null));

            storageService.multiGet(downloader, ['key1', 'key2']).catch(error => {
                expect(error).toBeNull();
                done();
            });
        });
    });

    describe('getAllKeyValuePairs', () => {
        it('should get all objects if value is JSON for a tenant', done => {
            storageService.getAllKeyValuePairs(cache).then(data => {
                expect(data).toEqual([['key1', mockData], ['key2', mockData]]);
                expect(AsyncStorage.multiGet).toHaveBeenCalledWith(['CACHE#key1', 'CACHE#key2']);
                expect(AsyncStorage.multiGet).toHaveBeenCalledTimes(1);
                done();
            });
        });

        it('should get all strings if value is not JSON for a tenant', done => {
            AsyncStorage.multiGet.mockImplementation(keys =>
                Promise.resolve(
                    _.filter(
                        mockDownloaderKeyValuePairs,
                        keyValuePair => _.indexOf(keys, keyValuePair[0]) !== -1
                    )
                )
            );

            storageService.getAllKeyValuePairs(downloader).then(data => {
                expect(data).toEqual([['key1', mockString], ['key2', mockString]]);
                expect(AsyncStorage.multiGet).toHaveBeenCalledWith([
                    'DOWNLOADER#key1',
                    'DOWNLOADER#key2'
                ]);
                expect(AsyncStorage.multiGet).toHaveBeenCalledTimes(1);
                done();
            });
        });

        it('should not swallow exceptions (multiGet reject)', done => {
            AsyncStorage.multiGet.mockImplementation(() => Promise.reject(null));

            storageService.getAllKeyValuePairs(downloader).catch(error => {
                expect(error).toBeNull();
                done();
            });
        });

        it('should not swallow exceptions (getAllKeys reject)', done => {
            AsyncStorage.getAllKeys.mockImplementation(() => Promise.reject(null));

            storageService.getAllKeyValuePairs(downloader).catch(error => {
                expect(error).toBeNull();
                done();
            });
        });
    });

    describe('multiRemove', () => {
        it("should remove all items from a tenant's storage given an array of keys", done => {
            storageService.multiRemove(downloader, ['key1', 'key2']).then(() => {
                expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
                    'DOWNLOADER#key1',
                    'DOWNLOADER#key2'
                ]);
                expect(AsyncStorage.multiRemove).toHaveBeenCalledTimes(1);
                done();
            });
        });

        it('should not swallow exceptions', done => {
            AsyncStorage.multiRemove.mockImplementation(() => Promise.reject(null));

            storageService.multiRemove(downloader, ['key1', 'key2']).catch(error => {
                expect(error).toBeNull();
                done();
            });
        });
    });

    describe('clear', () => {
        it('should remove all key value pairs of a tenant', done => {
            storageService.clear(downloader).then(() => {
                expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
                    'DOWNLOADER#key1',
                    'DOWNLOADER#key2'
                ]);
                expect(AsyncStorage.multiRemove).toHaveBeenCalledTimes(1);
                done();
            });
        });

        it('should not swallow exceptions (getAllKeys reject)', done => {
            AsyncStorage.getAllKeys.mockImplementation(() => Promise.reject(null));

            storageService.clear(cache).catch(error => {
                expect(error).toBeNull();
                done();
            });
        });

        it('should not swallow exceptions (multiRemove reject)', done => {
            AsyncStorage.multiRemove.mockImplementation(() => Promise.reject(null));

            storageService.clear(cache).catch(error => {
                expect(error).toBeNull();
                done();
            });
        });
    });

    describe('Manage storage tenants', () => {

        it('should add a storage tenant if it is not in the list', () => {
            const mockTenantKey = 'memes galore';
            storageService.clearStorageTenants();
            const mockStorageTenants = {
                memesGalore: 'MEMES_GALORE'
            };
            storageService.addStorageTenant(mockTenantKey);
            const storageTenants = storageService.getStorageTenants();
            expect(storageTenants).toEqual(mockStorageTenants);
        });

        it('should remove a storage tenant if it is in the list', () => {
            const mockTenantKey = 'downloader';
            storageService.removeStorageTenant(mockTenantKey);
            const storageTenants = storageService.getStorageTenants();
            expect(storageTenants[mockTenantKey]).toBeFalsy();
        });
    });
});
