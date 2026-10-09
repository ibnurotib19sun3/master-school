<?php
use App\Models\User;
use App\Models\Tatausaha;
$u = User::where('email','temp.qa.tu8@example.test')->first();
if ($u) {
    Tatausaha::where('user_id', $u->id)->delete();
    $u->delete();
}
echo "cleaned\n";
