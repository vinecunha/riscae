import { create } from 'zustand';
import { supabase } from '../services/supabase';

export const useCartStore = create((set, get) => ({
  lists: [],
  items: [],
  history: [],

  addList: (name) => {
    const newList = { id: Date.now().toString(), name, total: 0 };
    set((state) => ({ lists: [...state.lists, newList] }));
  },

  removeList: (listId) => {
    set((state) => ({
      lists: state.lists.filter((l) => l.id !== listId),
      items: state.items.filter((i) => i.listId !== listId),
    }));
  },

  updateListName: (listId, newName) => {
    set((state) => ({
      lists: state.lists.map((l) => (l.id === listId ? { ...l, name: newName } : l)),
    }));
  },

  importList: (listData, listItems) => {
    const listId = Date.now().toString();
    const newList = { ...listData, id: listId };
    const itemsWithId = listItems.map((item) => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      listId: listId,
    }));
    set((state) => ({
      lists: [...state.lists, newList],
      items: [...state.items, ...itemsWithId],
    }));
  },

  addItem: (listId, name, unitType) => {
    if (!name.trim()) return;
    const newItem = {
      id: Date.now().toString(),
      listId,
      name,
      unitType,
      price: 0,
      amount: 1,
      completed: false,
    };
    set((state) => ({ items: [...state.items, newItem] }));
  },

  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== itemId),
    }));
    get().calculateTotal();
  },

  reopenItem: (itemId) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, completed: false } : i
      ),
    }));
    get().calculateTotal();
  },

  updateItemType: (itemId, newType) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, unitType: newType } : i
      ),
    }));
  },

  confirmItem: (itemId, price, amount) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, price, amount, completed: true } : i
      ),
    }));
    get().calculateTotal();
  },

  calculateTotal: () => {
    const { lists, items } = get();
    const updatedLists = lists.map((list) => {
      const listItems = items.filter((i) => i.listId === list.id && i.completed);
      const total = listItems.reduce((acc, curr) => acc + curr.price * curr.amount, 0);
      return { ...list, total };
    });
    set({ lists: updatedLists });
  },

  finishList: async (listId, marketData) => {
    const state = get();
    const listToFinish = state.lists.find(l => l.id === listId);
    const listItems = state.items.filter(item => item.listId === listId && item.completed);

    if (!listToFinish || listItems.length === 0) return;

    const historyEntry = {
      id: Date.now().toString(),
      listName: listToFinish.name,
      date: new Date().toLocaleDateString('pt-BR'),
      total: listToFinish.total,
      itemsCount: state.items.filter(i => i.listId === listId).length,
      completedCount: listItems.length,
      market: marketData.name,
      market_id: String(marketData.place_id),
      items: listItems 
    };

    set((state) => ({
      history: [historyEntry, ...state.history],
      lists: state.lists.filter(l => l.id !== listId),
      items: state.items.filter(i => i.listId !== listId)
    }));

    try {
      await supabase.from('mercados').upsert({
        osm_id: String(marketData.place_id),
        nome: marketData.name,
        endereco: marketData.address
      }, { onConflict: 'osm_id' });

      const priceHistory = listItems.map(item => ({
        mercados_id: String(marketData.place_id), 
        nome_item: item.name.toLowerCase().trim(),
        preco: item.price,
        unidade: item.unitType
      }));

      const { error: insertError } = await supabase
        .from('historico_precos')
        .insert(priceHistory);

      if (insertError) throw insertError;

    } catch (error) {
      console.error("Erro na sincronização Supabase:", error.message);
    }
  },

  clearHistory: () => set({ history: [] }),
  
  deleteHistoryEntry: (id) => set((state) => ({
    history: state.history.filter(h => h.id !== id)
  })),

  duplicateFromHistory: (historyId) => {
    const entry = get().history.find(h => h.id === historyId);
    if (!entry) return;

    const newListId = Date.now().toString();
    const newList = { id: newListId, name: `${entry.listName} (Cópia)`, total: 0 };
    
    const newItems = (entry.items || []).map(item => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      listId: newListId,
      completed: false,
      price: 0
    }));

    set((state) => ({
      lists: [...state.lists, newList],
      items: [...state.items, ...newItems]
    }));
  }
}));