'use client'

import styles from '../auth.module.css'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = (data: SignupFormValues) => {
    console.log('Signup attempt:', data)
    // TODO: Connect to Supabase Auth
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>Start your AI-powered internship journey.</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input 
              id="email" 
              type="email" 
              className={styles.input} 
              {...register('email')} 
            />
            {errors.email && <span className={styles.error}>{errors.email.message}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input 
              id="password" 
              type="password" 
              className={styles.input} 
              {...register('password')} 
            />
            {errors.password && <span className={styles.error}>{errors.password.message}</span>}
          </div>

          <button type="submit" className={styles.submitButton}>Sign Up</button>
        </form>
      </div>
    </div>
  )
}
