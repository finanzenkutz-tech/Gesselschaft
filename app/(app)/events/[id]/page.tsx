import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Calendar, MapPin, Users, ArrowLeft, Trash2, Car, Pizza, Dice5, MessageCircle, Info, Star, ShieldCheck, Coffee, User, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CarpoolingWidget } from '@/components/events/carpooling-widget'
import { GroupChatWidget } from '@/components/groups/group-chat-widget'
import { GameTrackingWidget } from '@/components/events/game-tracking-widget'
import { getEventSessions } from '@/app/(app)/events/session-actions'
import { deleteAnyEvent } from '@/app/(app)/admin/actions'
import { RSVPButtons } from '@/components/events/rsvp-buttons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GameSuggestions } from '@/components/events/game-suggestions'
import { EventBringsWidget } from '@/components/events/event-brings-widget'
import { EventWishesWidget } from '@/components/events/event-wishes-widget'
import { CalendarExport } from '@/components/events/calendar-export'
import { SessionReportForm } from '@/components/events/session-report-form'
import { EventComments } from '@/components/events/event-comments'
import { CheckInButton } from '@/components/events/check-in-button'
import { getMutedUsers } from '@/app/(app)/settings/user-settings-actions'
import { getSmartRecommendations } from '@/app/(app)/groups/recommendation-actions'
import { PostEventReviewPrompt } from '@/components/events/post-event-review-prompt'
import { UserProfileDialog } from '@/components/profile/user-profile-dialog'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // ... (existing code for profile and superadmin) ...
    const { data: profile } = await supabase
        .from('profiles')
        .select('system_role')
        .eq('id', user?.id)
        .single()

    const isSuperAdmin = profile?.system_role === 'super_admin'

    const { data: event, error: fetchError } = await supabase
        .from('events')
        .select('*, groups(*), profiles(*), event_attendees(*, profiles(*)), carpooling(*, profiles(*), carpool_passengers(*))')
        .eq('id', id)
        .maybeSingle()

    if (fetchError || !event) {
        console.error('Event fetch error:', fetchError)
        return notFound()
    }

    const attendees = event.event_attendees || []
    const userRSVP = attendees.find((a: any) => a.user_id === user?.id)

    // Fetch smart recommendations
    const smartRecommendations = await getSmartRecommendations(event.group_id)

    // Check for Post-Event Reviews
    const isEnded = new Date(event.end_time || event.start_time) < new Date()
    let gamesToReview: { name: string, imageUrl?: string }[] = []

    if (isEnded && userRSVP?.status === 'going') {
        const sessions = await getEventSessions(id)

        // Fetch user's existing reviews for these games in this group
        const gameNames = Array.from(new Set(sessions.map((s: any) => s.game_name)))
        const { data: existingReviews } = await supabase
            .from('game_reviews')
            .select('game_name')
            .eq('user_id', user?.id)
            .eq('group_id', event.group_id)
            .in('game_name', gameNames)

        const reviewedGameNames = new Set(existingReviews?.map(r => r.game_name) || [])

        gamesToReview = sessions
            .filter((s: any) => !reviewedGameNames.has(s.game_name))
            .map((s: any) => ({ name: s.game_name, imageUrl: s.game_image_url }))

        // Deduplicate
        gamesToReview = Array.from(new Map(gamesToReview.map(item => [item.name, item])).values())
    }
    const goingCount = attendees.filter((a: any) => a.status === 'going').length
    const guestCounts = attendees.reduce((acc: number, curr: any) => acc + (curr.guest_count || 0), 0)
    const totalHeadcount = goingCount + guestCounts

    const maybeCount = attendees.filter((a: any) => a.status === 'maybe').length

    // Fetch game sessions
    const sessions = await getEventSessions(id)



    // Fetch Group Inventory for suggestions
    const { data: groupInventory } = await supabase
        .from('inventory')
        .select('*, owner:profiles(full_name)')
        .eq('group_id', event.group_id)

    // Fetch Event Comments
    const { data: comments } = await supabase
        .from('event_comments')
        .select('*, profiles(full_name, avatar_url)')
        .eq('event_id', id)
        .order('created_at', { ascending: true })

    // --- NEW FEATURES DATA FETCHING ---

    // Fetch Brings
    const { data: brings } = await supabase
        .from('event_brings')
        .select('*, profiles(full_name), inventory(name), claimer:claimed_by(full_name, avatar_url)')
        .eq('event_id', id)

    // Fetch Wishes
    const { data: wishes } = await supabase
        .from('event_wishes')
        .select('*, profiles(full_name), inventory(*, owner:profiles(full_name))')
        .eq('event_id', id)

    // Inventory of attendees (for wishing)
    const attendeeIds = attendees.map((a: any) => a.user_id)
    const { data: attendeeInventory } = await supabase
        .from('inventory')
        .select('*, owner:profiles(full_name)')
        .in('owner_id', attendeeIds.length > 0 ? attendeeIds : ['00000000-0000-0000-0000-000000000000']) // Prevent empty IN clause error

    // My Inventory (for bringing)
    const { data: myInventory } = await supabase
        .from('inventory')
        .select('*')
        .eq('owner_id', user?.id)

    // Fetch Group Places to detect Private Location
    const { data: groupPlaces } = await supabase
        .from('group_places')
        .select('*')
        .eq('group_id', event.group_id)

    const matchingPlace = groupPlaces?.find(p => p.name.trim() === event.location?.trim())
    const isPrivateLocation = matchingPlace?.is_private
    const isHost = isPrivateLocation
        ? matchingPlace?.created_by === user?.id
        : event.created_by === user?.id

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('de-DE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Link href="/events" className="inline-flex items-center text-slate-500 hover:text-primary font-bold gap-2 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                Zurück zur Übersicht
            </Link>

            {/* Review Prompt */}
            {gamesToReview.length > 0 && (
                <PostEventReviewPrompt
                    eventId={id}
                    groupId={event.group_id}
                    gamesToReview={gamesToReview}
                />
            )}

            {/* Header Section */}
            <div className="sky-card overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-primary to-blue-600 p-8 md:p-12 flex flex-col justify-end text-white relative">
                    <div className="absolute top-0 right-0 p-4 flex gap-2">
                        {(isSuperAdmin || event.created_by === user?.id) && (
                            <form action={async () => {
                                'use server'
                                await deleteAnyEvent(id)
                                redirect('/events')
                            }}>
                                <Button
                                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-none rounded-xl h-10 w-10 p-0"
                                    variant="outline"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </form>
                        )}
                        <Calendar className="w-48 h-48 opacity-10 absolute -top-10 -right-10 pointer-events-none" />
                    </div>
                    <div className="relative z-10 text-shadow-sm">
                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-wider mb-3 shadow-sm border border-white/10">
                            {event.groups?.name || 'Gruppe'}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-md">{event.title}</h1>
                    </div>
                </div>

                <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center shrink-0 border border-blue-100">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Datum & Zeit</p>
                                <p className="text-slate-700 font-bold text-lg">{formatDate(event.start_time)}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-secondary flex items-center justify-center shrink-0 border border-sky-100">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Ort</p>
                                <p className="text-slate-700 font-bold text-lg">{event.location || 'Ort folgt'}</p>
                                {/* Google Maps Route Link */}
                                {(matchingPlace?.address || (event.location && event.location !== 'Online')) && (
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(matchingPlace?.address || event.location)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-secondary font-bold hover:underline flex items-center gap-1 mt-1"
                                    >
                                        <Navigation className="w-3 h-3" /> Route planen
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-slate-50/50 border-t border-slate-100">
                    <div className="flex flex-col gap-4 w-full md:w-auto">
                        <RSVPButtons
                            eventId={id}
                            currentStatus={userRSVP?.status}
                            currentGuestCount={userRSVP?.guest_count || 0}
                            currentArrival={userRSVP?.expected_arrival?.slice(0, 5)}
                            currentDeparture={userRSVP?.expected_departure?.slice(0, 5)}
                        />
                        {userRSVP?.status === 'going' && (
                            <CheckInButton
                                eventId={id}
                                checkedInAt={userRSVP.checked_in_at}
                                checkedOutAt={userRSVP.checked_out_at}
                                isGoing={true}
                            />
                        )}
                    </div>
                    <CalendarExport
                        eventId={id}
                        eventTitle={event.title}
                        startTime={event.start_time}
                        location={event.location}
                    />
                </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-blue-50/50 rounded-2xl gap-1">
                    <TabsTrigger value="details" className="h-10 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs md:text-sm">
                        <Info className="w-4 h-4 mr-2 hidden md:block" />
                        Infos
                    </TabsTrigger>
                    <TabsTrigger value="logistics" className="h-10 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs md:text-sm">
                        <Pizza className="w-4 h-4 mr-2 hidden md:block" />
                        Logistik
                    </TabsTrigger>
                    <TabsTrigger value="games" className="h-10 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs md:text-sm">
                        <Dice5 className="w-4 h-4 mr-2 hidden md:block" />
                        Spiele
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="h-10 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs md:text-sm">
                        <MessageCircle className="w-4 h-4 mr-2 hidden md:block" />
                        Chat
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8">
                            <section className="sky-card p-8 space-y-4">
                                {/* Private Host Info */}
                                {isPrivateLocation && (
                                    <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 mb-8">
                                        <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-2">
                                            <ShieldCheck className="w-5 h-5" /> Privater Gastgeber
                                        </h3>
                                        <p className="text-sm text-slate-600 mb-4">
                                            Dieses Event findet bei einem Mitglied privat statt. Bitte gehe respektvoll mit der Location um.
                                        </p>
                                        {matchingPlace?.host_info && (
                                            <p className="text-sm italic text-amber-700 p-3 bg-white/50 rounded-xl border border-amber-100 mb-4">
                                                Hinweis vom Gastgeber: "{matchingPlace.host_info}"
                                            </p>
                                        )}

                                        {isHost && (
                                            <div className="mt-4 pt-4 border-t border-amber-200/50">
                                                <h4 className="font-bold text-sm text-amber-900 mb-3 flex items-center gap-2">
                                                    <Coffee className="w-4 h-4" /> Gäste-Vorlieben (Nur für dich sichtbar)
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {attendees.filter((a: any) => a.status === 'going').map((a: any) => {
                                                        const prefs = a.profiles?.guest_preferences as any
                                                        if (!prefs || Object.keys(prefs).length === 0) return null
                                                        return (
                                                            <div key={a.user_id} className="p-3 bg-white rounded-xl text-xs border border-amber-100 shadow-sm">
                                                                <div className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                                                                    <User className="w-3 h-3" /> {a.profiles.full_name}
                                                                </div>
                                                                {prefs.dietary && <div className="text-slate-600"><span className="font-semibold text-amber-600">Ernährung:</span> {prefs.dietary}</div>}
                                                                {prefs.favorite_drink && <div className="text-slate-600"><span className="font-semibold text-amber-600">Getränk:</span> {prefs.favorite_drink}</div>}
                                                                {prefs.notes && <div className="text-slate-500 italic mt-1">"{prefs.notes}"</div>}
                                                            </div>
                                                        )
                                                    })}
                                                    {attendees.filter((a: any) => a.status === 'going' && (!a.profiles?.guest_preferences || Object.keys(a.profiles?.guest_preferences).length === 0)).length > 0 && (
                                                        <div className="p-3 text-slate-400 italic text-xs flex items-center justify-center">
                                                            Keine weiteren Infos vorhanden.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                    <Info className="w-6 h-6 text-primary" />
                                    Beschreibung
                                </h2>
                                <div className="text-slate-600 leading-relaxed font-medium">
                                    {event.description || 'Keine Beschreibung vorhanden.'}
                                </div>
                            </section>

                            <section className="sky-card p-8">
                                <EventComments
                                    eventId={id}
                                    initialComments={comments || []}
                                    currentUserId={user?.id || ''}
                                />
                            </section>
                        </div>

                        <aside className="sky-card p-6 h-fit sticky top-24">
                            <h3 className="font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                Teilnehmer ({totalHeadcount})
                            </h3>
                            <div className="space-y-4">
                                {attendees.filter((a: any) => a.status === 'going').map((attendee: any) => {
                                    const isHost = attendee.user_id === event.created_by
                                    return (
                                        <UserProfileDialog
                                            key={attendee.user_id}
                                            userId={attendee.user_id}
                                            currentUserId={user?.id}
                                            trigger={
                                                <div className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-colors group/attendee cursor-pointer">
                                                    <div className="relative">
                                                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm ring-2 ring-blue-50">
                                                            <AvatarImage src={attendee.profiles?.avatar_url || undefined} />
                                                            <AvatarFallback className="bg-blue-50 text-blue-500 font-bold">
                                                                {attendee.profiles?.full_name?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        {isHost && (
                                                            <div className="absolute -top-1 -right-1 bg-amber-400 text-white text-[8px] font-black h-4 px-1 rounded-full border border-white shadow-sm flex items-center justify-center">👑</div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-bold text-slate-800 truncate group-hover/attendee:text-primary transition-colors text-left">
                                                            {attendee.profiles?.full_name}
                                                        </p>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {isHost ? (
                                                                <span className="text-[10px] text-amber-500 font-black uppercase tracking-tighter">Host</span>
                                                            ) : (
                                                                <span className="text-[10px] text-emerald-500 font-black uppercase tracking-tighter">Dabei</span>
                                                            )}
                                                            {attendee.guest_count > 0 && (
                                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded-full font-bold">+{attendee.guest_count} Gäste</span>
                                                            )}
                                                            {attendee.expected_arrival && (
                                                                <span className="text-[10px] text-blue-500 font-bold bg-blue-50 px-1.5 rounded-full flex items-center gap-1">
                                                                    Ab {attendee.expected_arrival.slice(0, 5)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {attendee.note && (
                                                            <p className="text-[10px] text-slate-400 italic mt-1 line-clamp-2">
                                                                "{attendee.note}"
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            }
                                        />
                                    )
                                })}
                                {goingCount === 0 && (
                                    <p className="text-slate-400 text-sm italic text-center py-4">Noch keine Zusagen.</p>
                                )}
                            </div>

                            {maybeCount > 0 && (
                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Wackelkandidaten ({maybeCount})</p>
                                    <div className="flex -space-x-2 px-2">
                                        {attendees.filter((a: any) => a.status === 'maybe').map((attendee: any) => (
                                            <UserProfileDialog
                                                key={attendee.user_id}
                                                userId={attendee.user_id}
                                                currentUserId={user?.id}
                                                trigger={
                                                    <Avatar className="w-8 h-8 border-2 border-white shadow-sm ring-1 ring-slate-100 transition-transform hover:translate-y-[-2px] hover:z-10 cursor-pointer" title={attendee.profiles?.full_name}>
                                                        <AvatarImage src={attendee.profiles?.avatar_url || undefined} />
                                                        <AvatarFallback className="text-[10px] bg-slate-50 text-slate-400">{attendee.profiles?.full_name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </aside>
                    </div>
                </TabsContent>

                <TabsContent value="logistics" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Mitbringliste Slot */}
                        {/* Mitbringliste Slot */}
                        <EventBringsWidget
                            eventId={id}
                            brings={brings || []}
                            myInventory={myInventory || []}
                            userId={user?.id}
                        />
                        {/* Integration of Carpooling Widget */}
                        <CarpoolingWidget
                            eventId={id}
                            carpools={event.carpooling || []}
                            userId={user?.id}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="games" className="mt-6 space-y-8">
                    <EventWishesWidget
                        eventId={id}
                        wishes={wishes || []}
                        availableGames={attendeeInventory || []}
                        userId={user?.id}
                    />

                    <GameSuggestions
                        games={groupInventory || []}
                        playerCount={totalHeadcount}
                    />

                    {/* Game Tracking Widget */}
                    <GameTrackingWidget
                        eventId={id}
                        sessions={sessions as any}
                        attendees={attendees as any}
                        userId={user?.id}
                    />

                    {sessions && sessions.length > 0 && new Date(event.start_time) < new Date() && (
                        <div className="border-t border-slate-100 pt-8 mt-8">
                            <h3 className="text-xl font-bold text-slate-800 mb-4">Rückblick</h3>
                            <SessionReportForm
                                sessionId={sessions[0].id} // Simplified: Report for first session or need loop? Usually one report per session. Tracking widget lists sessions. 
                                attendees={attendees as any}
                                eventId={id}
                            />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="chat" className="mt-6">
                    <GroupChatWidget
                        groupId={event.group_id}
                        user={user}
                    />
                </TabsContent>
            </Tabs>
        </div >
    )
}
