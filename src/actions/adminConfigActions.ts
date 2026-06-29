'use server'

import dbConnect from '@/db/connection';
import SystemConfig, { type ISystemConfig } from '@/db/models/SystemConfig';
import { revalidatePath } from 'next/cache';
import { ensureAdmin } from '@/lib/ensureAdmin'

async function ensureSystemConfigExists() {
  const defaultConfig = {
    _id: 'main',
    autoBlockOtherCabins: true,
  };

  try {

    await dbConnect();

    const existingConfig = await SystemConfig.findById('main');

    if (!existingConfig) {
      await SystemConfig.create(defaultConfig);
      return;
    }

    let needsUpdate = false;
    const updates: Record<string, unknown> = {};

    if (typeof existingConfig.autoBlockOtherCabins !== 'boolean') {
      updates.autoBlockOtherCabins = defaultConfig.autoBlockOtherCabins;
      needsUpdate = true;
    }
    if (needsUpdate) {
      await SystemConfig.findByIdAndUpdate('main', updates, { runValidators: false });
    }

  } catch (error) {
    console.error(error);
  }
}

export async function getSystemConfig() {
  await ensureAdmin();
  try {

    await ensureSystemConfigExists();
    await dbConnect();
    const config = await SystemConfig.findById('main');

    if (!config) {
      return {
        autoBlockOtherCabins: true,
      };
    }

    return {
      autoBlockOtherCabins: config.autoBlockOtherCabins,
    };
  } catch (error) {
    console.error(error);
    return {
      autoBlockOtherCabins: true,
    };
  }
}

export async function updateSystemConfigSetting(
  settingKey: keyof ISystemConfig,
  value: boolean
): Promise<{ success: boolean; currentValue?: boolean; message: string }> {
  await ensureAdmin();
  try {
    await dbConnect();
    const config = await SystemConfig.findByIdAndUpdate(
      'main',
      { [settingKey]: value },
      { upsert: true, new: true, runValidators: true }
    );

    revalidatePath('/', 'layout');

    return {
      success: true,
      currentValue: config[settingKey as keyof typeof config],
      message: value ? "Enabled." : "Disabled."
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Save error." };
  }
}