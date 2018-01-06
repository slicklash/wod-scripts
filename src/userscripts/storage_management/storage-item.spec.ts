import { StorageItem } from './storage-item';

describe('isConsumable', () => {

  const special = ['raw leather', 'acorn seed', 'reagent:x', 'lesser emblem of x', 'glass wand'];

  special.forEach(x => {
    it(`should return true for ${x}`, () => {
      const item = new StorageItem();
      item.name = x;
      expect(item.isConsumable).toEqual(true);
    });
  });

  it('should return false', () => {
     const item = new StorageItem();
     item.name = 'torch';
     expect(item.isConsumable).toEqual(false);
  });

});
