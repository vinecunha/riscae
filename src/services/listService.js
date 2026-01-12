import { supabase } from './supabase';

export const listService = {
  // BACKUP: Salva ou atualiza a lista na nuvem
  async backupLists(userId, lists) {
    if (!userId) return;

    for (const list of lists) {
      const { error } = await supabase
        .from('user_lists')
        .upsert({
          user_id: userId,
          name: list.name,
          market: list.market || '',
          items: list.items,
          total: list.total || 0,
          updated_at: new Date()
        }, { onConflict: 'user_id, name' }); // Evita duplicados com mesmo nome

      if (error) console.error('Erro no backup:', error.message);
    }
  },

  // RESTORE: Busca as listas da nuvem
  async restoreLists(userId) {
    if (!userId) return [];
    
    const { data, error } = await supabase
      .from('user_lists')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Erro no restore:', error.message);
      return [];
    }
    return data;
  }
};