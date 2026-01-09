<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\UserType;
use Illuminate\Database\Seeder;

class ParticipantSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $countries = [
            ['code' => 'BN', 'name' => 'Brunei', 'flag' => '/asean/brunei.jpg'],
            ['code' => 'KH', 'name' => 'Cambodia', 'flag' => '/asean/cambodia.jpg'],
            ['code' => 'ID', 'name' => 'Indonesia', 'flag' => '/asean/indonesia.jpg'],
            ['code' => 'LA', 'name' => 'Laos', 'flag' => '/asean/laos.jpg'],
            ['code' => 'MY', 'name' => 'Malaysia', 'flag' => '/asean/malaysia.jpg'],
            ['code' => 'MM', 'name' => 'Myanmar', 'flag' => '/asean/myanmar.jpg'],
            ['code' => 'PH', 'name' => 'Philippines', 'flag' => '/asean/philippines.jpg'],
            ['code' => 'SG', 'name' => 'Singapore', 'flag' => '/asean/singapore.jpg'],
            ['code' => 'TH', 'name' => 'Thailand', 'flag' => '/asean/thailand.jpg'],
            ['code' => 'VN', 'name' => 'Vietnam', 'flag' => '/asean/vietnam.jpg'],
        ];

        foreach ($countries as $country) {
            Country::updateOrCreate(
                ['code' => $country['code']],
                [
                    'name' => $country['name'],
                    'flag_path' => $country['flag'],
                    'is_active' => true,
                ]
            );
        }

        $userTypes = ['Prime Minister', 'Staff', 'CHED'];

        foreach ($userTypes as $type) {
            UserType::updateOrCreate(
                ['name' => $type],
                [
                    'slug' => \Illuminate\Support\Str::slug($type),
                    'is_active' => true,
                ]
            );
        }
    }
}
