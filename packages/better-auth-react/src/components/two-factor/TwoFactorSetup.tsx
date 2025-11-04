import { useState } from 'react'

interface TwoFactorSetupProps {
  className?: string
  onSetup?: () => Promise<{ uri: string; secret: string }>
  onVerify?: (code: string) => Promise<void>
}

export function TwoFactorSetup({
  className = '',
  onSetup,
  onVerify,
}: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup')
  const [twoFactorData, setTwoFactorData] = useState<{
    uri: string
    secret: string
  } | null>(null)
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSetup = async () => {
    if (!onSetup) {
      setError('2FA setup function not provided')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const data = await onSetup()
      setTwoFactorData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to setup 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onVerify) {
      setError('2FA verify function not provided')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      await onVerify(code)
      setStep('complete')
    } catch (err: any) {
      setError(err.message || 'Invalid code')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'setup' && !twoFactorData) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900">
          Setup Two-Factor Authentication
        </h3>
        <p className="text-sm text-gray-600">
          Enable two-factor authentication to add an extra layer of security to
          your account.
        </p>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          onClick={handleSetup}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Setting up...' : 'Setup 2FA'}
        </button>
      </div>
    )
  }

  if (step === 'complete') {
    return (
      <div className={`text-center ${className}`}>
        <div className="text-green-600 text-lg font-semibold">
          2FA Setup Complete!
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Your account is now protected with two-factor authentication.
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900">
        Setup Two-Factor Authentication
      </h3>

      {step === 'setup' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Scan the QR code below with your authenticator app, then enter the
            code to complete setup.
          </p>

          {isLoading && <div className="text-center">Loading QR code...</div>}

          {twoFactorData && (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFactorData.uri)}`}
                  alt="2FA QR Code"
                  className="w-48 h-48"
                />
              </div>

              <div className="text-xs text-gray-500 text-center max-w-md">
                <p>Can't scan? Enter this secret manually:</p>
                <code className="bg-gray-100 px-2 py-1 rounded mt-1 block">
                  {twoFactorData.secret}
                </code>
              </div>

              <button
                onClick={() => setStep('verify')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                I've scanned the code
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'verify' && (
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700"
            >
              Enter the 6-digit code from your authenticator app
            </label>
            <input
              id="code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="000000"
              maxLength={6}
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Verify & Complete Setup'}
          </button>

          <button
            type="button"
            onClick={() => setStep('setup')}
            className="w-full text-sm text-gray-600 hover:text-gray-800"
          >
            Back to QR code
          </button>
        </form>
      )}
    </div>
  )
}
