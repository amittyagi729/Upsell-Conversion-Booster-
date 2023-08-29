<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use GuzzleHttp\Client;
use App\Models\Session;
class Session extends Model
{
    use HasFactory;

    protected $fillable = [
        'access_token',
        'shop',
        // other columns you might have...
    ];

}

