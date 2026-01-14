'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
import { LocationPicker } from "./location-picker"

export function ViewPlaceMapDialog({
    latitude,
    longitude,
    name
}: {
    latitude: number,
    longitude: number,
    name: string
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                    <MapPin className="w-3 h-3 mr-1" />
                    Karte
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl rounded-[2rem] p-0 overflow-hidden bg-white">
                <div className="bg-blue-500 p-6 text-white">
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        {name}
                    </DialogTitle>
                </div>
                <div className="p-0">
                    <LocationPicker
                        initialLat={latitude}
                        initialLng={longitude}
                        initialName={name}
                        showSaveButton={false}
                        showPublicSwitch={false}
                        showNameInput={false}
                        height="h-[400px]"
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
