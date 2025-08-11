'use client'

import { useState } from 'react'
import { useParams} from 'next/navigation'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import Footer from '@/components/Footer/Footer'

export default function ResetPasswordPage() {
  const { token } = useParams() as { token: string }
  const router = useRouter()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setLoading(true)

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu không khớp')
      setLoading(false)
      return
    }

    const passwordRegex = /^.{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, confirmPassword }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      

      toast.success(data.message)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi đặt lại mật khẩu')
    } finally {
      setLoading(false)
    }
  }


  return (
    <>
    <div className="max-w-md mx-auto mt-20 mb-20 px-6 py-8 bg-white shadow-lg rounded-2xl border border-gray-200">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          <i className="fas fa-lock text-green-600 mr-2"></i>
          Đặt lại mật khẩu
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mật khẩu mới */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu mới
            </label>
            <input
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu mới"
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-[65%] transform -translate-y-1/2 text-gray-400"
            >
              <i className={`fas ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>

          {/* Xác nhận mật khẩu */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Xác nhận mật khẩu
            </label>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Nhập lại mật khẩu"
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-[65%] transform -translate-y-1/2 text-gray-400"
            >
              <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-white font-semibold transition-all duration-300 ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            <i className="fas fa-check-circle"></i>
            {loading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </form>

        {message && (
          <p className="text-green-600 mt-4 text-center font-medium">{message}</p>
        )}
        {error && (
          <p className="text-red-500 mt-4 text-center font-medium">{error}</p>
        )}
      </div>
      <Footer/>
    </>
  )
}
