import prisma from '@/lib/prisma'
import { isEmailValid } from '@/lib/regex'
import { generateSerial } from '@/lib/serial'
import { getErrorResponse } from '@/lib/utils'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import config from '@/config/site'
import Mail from '@/mails/verify'
import { render } from '@react-email/render'
import { sendMail } from '@persepolis/mail'

export async function POST(req: NextRequest) {
   try {
      const OTP = generateSerial({})

      const { email } = await req.json()

      if (isEmailValid(email)) {
         await prisma.owner.update({
            where: { email },
            data: {
               OTP,
            },
         })

         await sendMail({
            name: config.name,
            to: email,
            subject: 'Verify your email.',
            html: render(Mail({ code: OTP, name: config.name })),
         })

         return new NextResponse(
            JSON.stringify({
               status: 'success',
               email,
            }),
            {
               status: 200,
               headers: { 'Content-Type': 'application/json' },
            }
         )
      }

      if (!isEmailValid(email)) {
         return getErrorResponse(400, 'Incorrect Email')
      }
   } catch (error) {
      console.error(error)
      if (error instanceof ZodError) {
         return getErrorResponse(400, 'failed validations', error)
      }

      return getErrorResponse(500, error.message)
   }
}
