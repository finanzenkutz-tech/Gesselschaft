import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, UserPlus, Dice5 } from "lucide-react"

export type ActivityType = 'event_created' | 'group_joined' | 'game_added'

export interface ActivityItem {
    id: string
    type: ActivityType
    title: string
    description: string
    timestamp: string
    user?: {
        name: string
        avatar_url?: string
    }
}

interface ActivityFeedProps {
    activities: ActivityItem[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
    if (!activities || activities.length === 0) {
        return (
            <div className="sky-card p-6 h-full min-h-[300px] flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Calendar className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="font-bold text-slate-700">Keine Neuigkeiten</h3>
                <p className="text-sm text-slate-500 max-w-[200px]">
                    Hier siehst du, was deine Freunde und Gruppen machen.
                </p>
            </div>
        )
    }

    return (
        <div className="sky-card p-6 h-full">
            <h3 className="font-bold text-xl text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-orange-400 rounded-full" />
                Neuigkeiten
            </h3>

            <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-6">
                    {activities.map((activity) => (
                        <div key={activity.id} className="flex gap-4 relative group">
                            {/* Abstract timeline line */}
                            <div className="absolute left-[19px] top-10 bottom-[-24px] w-[2px] bg-slate-100 group-last:hidden" />

                            <Avatar className="w-10 h-10 border-2 border-white shadow-sm shrink-0">
                                <AvatarImage src={activity.user?.avatar_url} />
                                <AvatarFallback>{activity.user?.name?.[0] || '?'}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 pt-1">
                                <p className="text-sm font-medium text-slate-800">
                                    <span className="font-bold">{activity.user?.name}</span> {activity.title}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">{activity.description}</p>
                                <p className="text-[10px] uppercase font-bold text-slate-400 mt-2">
                                    {new Date(activity.timestamp).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} • {new Date(activity.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>

                            <div className="shrink-0 pt-2 opacity-50">
                                {activity.type === 'event_created' && <Calendar className="w-4 h-4 text-blue-500" />}
                                {activity.type === 'group_joined' && <UserPlus className="w-4 h-4 text-emerald-500" />}
                                {activity.type === 'game_added' && <Dice5 className="w-4 h-4 text-purple-500" />}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
