'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getGroupGoals(groupId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('group_goals')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching goals:', error)
        return []
    }
    return data
}

export async function createGroupGoal(groupId: string, data: {
    title: string,
    description?: string,
    targetValue: number,
    unit: string,
    endDate?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('group_goals')
        .insert({
            group_id: groupId,
            title: data.title,
            description: data.description,
            target_value: data.targetValue,
            unit: data.unit,
            end_date: data.endDate,
            created_by: user.id
        })

    if (error) throw error
    revalidatePath(`/groups/${groupId}`)
}

export async function updateGoalProgress(goalId: string, value: number, groupId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('group_goals')
        .update({ current_value: value })
        .eq('id', goalId)

    if (error) throw error
    revalidatePath(`/groups/${groupId}`)
}

export async function deleteGoal(goalId: string, groupId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('group_goals').delete().eq('id', goalId)
    if (error) throw error
    revalidatePath(`/groups/${groupId}`)
}
