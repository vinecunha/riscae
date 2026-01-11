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

      uploadBackup: async () => {
        try {
          const customerInfo = await Purchases.getCustomerInfo();
          if (customerInfo.entitlements.active['RISCAÊ Pro'] === undefined) {
            return "PAYWALL";
          }
          const userId = customerInfo.originalAppUserId;
          const { lists, items, history } = get();
          const { error } = await supabase
            .from('backups')
            .upsert({ 
              user_id: userId, 
              data: { lists, items, history },
              updated_at: new Date().toISOString() 
            }, { onConflict: 'user_id' });
          if (error) throw error;
          return "SUCCESS";
        } catch (e) {
          console.error("Erro no Upload:", e);
          return "ERROR";
        }
      },

      restoreBackup: async () => {
        try {
          const customerInfo = await Purchases.getCustomerInfo();
          if (customerInfo.entitlements.active['RISCAÊ Pro'] === undefined) {
            return "PAYWALL";
          }
          const userId = customerInfo.originalAppUserId;
          const { data, error } = await supabase
            .from('backups')
            .select('data')
            .eq('user_id', userId)
            .maybeSingle();
          if (error) throw error;
          if (data && data.data) {
            set({ 
              lists: data.data.lists || [], 
              items: data.data.items || [], 
              history: data.data.history || [] 
            });
            return "SUCCESS";
          }
          return "NO_BACKUP";
        } catch (e) {
          console.error("Erro na Restauração:", e);
          return "ERROR";
        }
      },

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

      addItem: (listId, name, unitType, extraData = {}) => {
        if (!name.trim()) return;
        const newItem = {
          id: Date.now().toString(),
          listId,
          name,
          unitType,
          price: 0,
          amount: 1,
          completed: false,
          brand: extraData.brand || 'Genérico',
          category: extraData.category || 'Outros'
        };
        set((state) => ({ items: [...state.items, newItem] }));
      },

      removeItem: (itemId) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }));
        get().calculateTotal();
      },

      reopenItem: (itemId) => {
        set((state) => ({
          items: state.items.map((i) => i.id === itemId ? { ...i, completed: false } : i),
        }));
        get().calculateTotal();
      },

      confirmItem: (itemId, price, amount) => {
        set((state) => ({
          items: state.items.map((i) => i.id === itemId ? { ...i, price, amount, completed: true } : i),
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

      duplicateFromHistory: (historyId) => {
        const entry = get().history.find(h => h.id === historyId);
        if (!entry) return;

        const newListId = Date.now().toString();
        const newList = { id: newListId, name: `${entry.listName} (Cópia)`, total: entry.total };
        
        const newItems = entry.items.map(item => ({
          ...item,
          id: Math.random().toString(36).substr(2, 9),
          listId: newListId,
          completed: false
        }));

        set((state) => ({
          lists: [...state.lists, newList],
          items: [...state.items, ...newItems]
        }));
      },

      deleteHistoryEntry: (id) => {
        set((state) => ({
          history: state.history.filter((h) => h.id !== id),
        }));
      },

      clearHistory: () => {
        Alert.alert(
          "Limpar Histórico",
          "Deseja apagar permanentemente todo o seu histórico de compras?",
          [
            { text: "Cancelar", style: "cancel" },
            { 
              text: "Limpar Tudo", 
              style: "destructive", 
              onPress: () => set({ history: [] }) 
            }
          ]
        );
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

          await supabase.from('historico_precos').insert(priceHistory);
        } catch (error) {
          console.error("Erro Supabase:", error.message);
        }
      }
    }),
    {
      name: 'riscae-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);