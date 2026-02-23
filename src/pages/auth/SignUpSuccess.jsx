"use client"

import { useNavigate } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { Mail, X } from "lucide-react"

export default function SignUpSuccess() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center relative">
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent transition-colors"
          title="Exit to home"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="text-primary" size={32} />
          </div>
          <h2 className="text-3xl font-bold mb-2">Check your email</h2>
          <p className="text-muted-foreground">
            We've sent you a confirmation link. Please check your email to verify your account.
          </p>
        </div>

        <div className="space-y-4">
          <Button onClick={() => navigate("/auth/login")} className="w-full">
            Go to Sign In
          </Button>
          <Button onClick={() => navigate("/")} variant="outline" className="w-full">
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  )
}
