'use client'

import { MainNav } from "@/components/layout/main-nav"
import { OnboardingTooltip } from "@/components/onboarding/tooltip-guide"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function Profile() {
  return (
    <div>
        <MainNav/>
       <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mt-10">
          <CardHeader>
            <CardTitle className="text-blue-900">Profile (Tez kunda)</CardTitle>
            <CardDescription className="text-blue-700">
              Do'konning barcha ma'lumotlari va statistikalar
              Obunalar boshqaruvi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-600">
              Bu funksiya keyingi yangilanishda qo'shiladi
            </p>
          </CardContent>
        </Card>

        

    </div>
  )
}

export default Profile
