import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // 管理者ユーザー作成
    const adminPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            passwordHash: adminPassword,
            fullName: '管理者',
            email: 'admin@daiyu.co.jp',
            role: 'admin',
        },
    })
    console.log('Created admin user:', admin.username)

    // 現場責任者ユーザー作成
    const managerPassword = await bcrypt.hash('manager123', 10)
    const manager = await prisma.user.upsert({
        where: { username: 'tanaka' },
        update: {},
        create: {
            username: 'tanaka',
            passwordHash: managerPassword,
            fullName: '田中太郎',
            email: 'tanaka@daiyu.co.jp',
            role: 'manager',
        },
    })
    console.log('Created manager user:', manager.username)

    // 作業員ユーザー作成
    const workerPassword = await bcrypt.hash('worker123', 10)
    const worker = await prisma.user.upsert({
        where: { username: 'yamada' },
        update: {},
        create: {
            username: 'yamada',
            passwordHash: workerPassword,
            fullName: '山田花子',
            email: 'yamada@daiyu.co.jp',
            role: 'worker',
        },
    })
    console.log('Created worker user:', worker.username)

    // サンプル工事マスタ
    const project1 = await prisma.project.upsert({
        where: { id: 1 },
        update: {},
        create: {
            projectCode: 'P-2024-001',
            projectName: '〇〇市道路改修工事',
            clientName: '〇〇市役所',
            siteAddress: '〇〇市△△町1-2-3',
            startDate: new Date('2024-01-15'),
            endDate: new Date('2024-06-30'),
        },
    })

    const project2 = await prisma.project.upsert({
        where: { id: 2 },
        update: {},
        create: {
            projectCode: 'P-2024-002',
            projectName: '△△ビル外構工事',
            clientName: '株式会社△△不動産',
            siteAddress: '□□市△△区2-3-4',
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-05-31'),
        },
    })

    console.log('Created projects:', project1.projectName, project2.projectName)

    // サンプル作業員マスタ
    const workers = await Promise.all([
        prisma.worker.upsert({
            where: { id: 1 },
            update: {},
            create: { workerName: '佐藤一郎', company: 'ダイユウ建設', position: '班長', hourlyRate: 2500 },
        }),
        prisma.worker.upsert({
            where: { id: 2 },
            update: {},
            create: { workerName: '鈴木二郎', company: 'ダイユウ建設', position: '作業員', hourlyRate: 2000 },
        }),
        prisma.worker.upsert({
            where: { id: 3 },
            update: {},
            create: { workerName: '高橋三郎', company: 'ダイユウ建設', position: '作業員', hourlyRate: 2000 },
        }),
    ])
    console.log('Created workers:', workers.length)

    // サンプル機械マスタ
    const equipment = await Promise.all([
        prisma.equipmentMaster.upsert({
            where: { id: 1 },
            update: {},
            create: { equipmentName: '4t ダンプ', modelNumber: 'No.1', hourlyRate: 3000 },
        }),
        prisma.equipmentMaster.upsert({
            where: { id: 2 },
            update: {},
            create: { equipmentName: '2t ダンプ', modelNumber: 'No.2', hourlyRate: 2500 },
        }),
        prisma.equipmentMaster.upsert({
            where: { id: 3 },
            update: {},
            create: { equipmentName: '0.25ユンボ', modelNumber: 'PC30MR', hourlyRate: 4000 },
        }),
    ])
    console.log('Created equipment:', equipment.length)

    // サンプル日報作成
    const report = await prisma.dailyReport.upsert({
        where: { id: 1 },
        update: {},
        create: {
            reportDate: new Date(),
            dayOfWeek: '土曜日',
            weather: '晴れ',
            reporterName: '田中太郎',
            projectName: '〇〇市道路改修工事',
            workStartTime: '08:00',
            workEndTime: '17:00',
            workContent: '道路舗装工事（アスファルト敷設）\n・現場準備\n・アスファルト運搬\n・舗装作業',
            status: 'submitted',
            createdById: manager.id,
            laborCosts: {
                create: [
                    { workerName: '佐藤一郎', hours: 8, unitPrice: 2500, amount: 20000 },
                    { workerName: '鈴木二郎', hours: 8, unitPrice: 2000, amount: 16000 },
                ],
            },
            companyEquipment: {
                create: [
                    { equipmentName: '4t ダンプ', hours: 6, unitPrice: 3000, amount: 18000 },
                    { equipmentName: '0.25ユンボ', hours: 4, unitPrice: 4000, amount: 16000 },
                ],
            },
            fuelCosts: {
                create: [
                    { productName: '軽油', vehicleNumber: '33-36', quantity: 50, unitPrice: 150, amount: 7500 },
                ],
            },
        },
    })
    console.log('Created sample report:', report.id)

    console.log('Database seeded successfully!')
}

main()
    .catch((e) => {
        console.error('Seed error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
