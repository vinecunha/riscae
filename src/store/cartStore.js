import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { Alert } from 'react-native';
import Purchases from 'react-native-purchases';

export const useCartStore = create(
  persist(
    (set, get) => ({
      lists: [],
      items: [],
      history: [],
      offlinePrices: {}, 
      uploadQueue: [],
      lastSyncedAt: null,

      syncOfflinePrices: async (itemNames) => {
        try {
          const { data, error } = await supabase
            .from('historico_precos')
            .select('nome_item, preco')
            .in('nome_item', itemNames);
          
          if (error) throw error;

          if (data) {
            const cache = {};
            data.forEach(d => {
              const key = d.nome_item.toLowerCase().trim();
              if (!cache[key] || d.preco < cache[key]) {
                cache[key] = d.preco;
              }
            });
            set({ offlinePrices: cache });
            return "SUCCESS";
          }
        } catch (e) {
          console.error(e);
          return "ERROR";
        }
      },

      processQueue: async () => {
        const { uploadQueue } = get();
        if (uploadQueue.length === 0) return;

        try {
          const { error } = await supabase.from('historico_precos').insert(uploadQueue);
          if (!error) {
            set({ uploadQueue: [] });
          }
        } catch (e) {
          console.log(e);
        }
      },

      uploadBackup: async (isSilent = false) => {
        try {
          const customerInfo = await Purchases.getCustomerInfo();
          if (customerInfo.entitlements.active['RISCAÊ Pro'] === undefined) return "PAYWALL";

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return "LOGIN_REQUIRED";

          const { lists, items, history } = get();
          const now = new Date().toISOString();

          const { error } = await supabase
            .from('backups')
            .upsert({ 
              user_id: user.id,
              data: { lists, items, history },
              updated_at: now 
            });

          if (error) throw error;
          set({ lastSyncedAt: now });
          return "SUCCESS";
        } catch (e) {
          return "ERROR";
        }
      },

      restoreBackup: async (isSilent = false) => {
        try {
          const customerInfo = await Purchases.getCustomerInfo();
          if (customerInfo.entitlements.active['RISCAÊ Pro'] === undefined) return "PAYWALL";

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return "LOGIN_REQUIRED";

          const { data, error } = await supabase
            .from('backups')
            .select('data, updated_at')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) throw error;

          if (data && data.data) {
            const localLastSync = get().lastSyncedAt;
            
            if (isSilent && localLastSync && new Date(data.updated_at) <= new Date(localLastSync)) {
              return "ALREADY_UPDATED";
            }

            set({ 
              lists: data.data.lists || [], 
              items: data.data.items || [], 
              history: data.data.history || [],
              lastSyncedAt: data.updated_at
            });
            return "SUCCESS";
          }
          return "NO_BACKUP";
        } catch (e) {
          console.error(e);
          return "ERROR";
        }
      },

      addItem: (listId, name, unitType, extraData = {}) => {
        if (!name.trim()) return;
        const newItem = {
          id: Math.random().toString(36).substr(2, 9) + Date.now().toString(),
          listId,
          name,
          unitType,
          price: extraData.price || 0,
          amount: extraData.amount || 1,
          completed: false,
          brand: extraData.brand || 'Genérico',
          category: extraData.category || 'Outros'
        };
        set((state) => ({ items: [...state.items, newItem] }));
        get().calculateTotal();
        get().uploadBackup(true); 
      },

      removeItem: (itemId) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }));
        get().calculateTotal();
        get().uploadBackup(true);
      },

      confirmItem: (itemId, price, amount) => {
        set((state) => ({
          items: state.items.map((i) => i.id === itemId ? { ...i, price, amount, completed: true } : i),
        }));
        get().calculateTotal();
        get().uploadBackup(true);
      },

      reopenItem: (itemId) => {
        set((state) => ({
          items: state.items.map((i) => i.id === itemId ? { ...i, completed: false } : i),
        }));
        get().calculateTotal();
        get().uploadBackup(true);
      },

      addList: (name, lockedMarket = null) => {
        const id = Date.now().toString();
        const newList = { id, name, total: 0, lockedMarket };
        set((state) => ({ lists: [...state.lists, newList] }));
        get().uploadBackup(true);
        return id;
      },

      importList: (newList, newItems) => {
        set((state) => ({
          lists: [...state.lists, newList],
          items: [...state.items, ...newItems]
        }));
        get().calculateTotal();
        get().uploadBackup(true);
      },

      removeList: (listId) => {
        set((state) => ({
          lists: state.lists.filter((l) => l.id !== listId),
          items: state.items.filter((i) => i.listId !== listId),
        }));
        get().uploadBackup(true);
      },

      updateListName: (listId, newName) => {
        set((state) => ({
          lists: state.lists.map((l) => (l.id === listId ? { ...l, name: newName } : l)),
        }));
        get().uploadBackup(true);
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

      deleteHistoryEntry: (id) => {
        set((state) => ({ history: state.history.filter(h => h.id !== id) }));
        get().uploadBackup(true);
      },

      clearHistory: () => {
        set({ history: [] });
        get().uploadBackup(true);
      },

      duplicateFromHistory: (historyId) => {
        const entry = get().history.find(h => h.id === historyId);
        if (!entry) return;

        const newListId = Date.now().toString();
        const newList = {
          id: newListId,
          name: `${entry.listName} (Cópia)`,
          total: 0,
          lockedMarket: null
        };

        const newItems = entry.items.map(item => ({
          ...item,
          id: Math.random().toString(36).substr(2, 9) + Date.now().toString(),
          listId: newListId,
          completed: false, // Inicia desmarcado para nova compra
          price: 0 // Opcional: zerar preço para nova cotação
        }));

        set(state => ({
          lists: [...state.lists, newList],
          items: [...state.items, ...newItems]
        }));
        get().uploadBackup(true);
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

        const priceHistory = listItems.map(item => ({
          mercados_id: String(marketData.place_id), 
          nome_item: item.name.toLowerCase().trim(),
          preco: item.price,
          unidade: item.unitType,
          data_compra: new Date().toISOString()
        }));

        try {
          await supabase.from('mercados').upsert({
            osm_id: String(marketData.place_id),
            nome: marketData.name,
            endereco: marketData.address
          }, { onConflict: 'osm_id' });

          await supabase.from('historico_precos').insert(priceHistory);
        } catch (error) {
          set((state) => ({ uploadQueue: [...state.uploadQueue, ...priceHistory] }));
        }
        get().uploadBackup(true);
      }
    }),
    {
      name: 'riscae-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);