<?php
/**
 * Template Name: 料金表
 * Description: 自費診療・保険診療の料金一覧
 */
get_header(); ?>

<!-- PAGE HERO -->
<section class="pg-hero">
  <div class="inner rv">
    <h1 class="pg-hero__title">
      <small>Price</small>
      <?php the_title(); ?>
    </h1>
    <p class="pg-hero__lead">治療費用のご案内</p>
  </div>
</section>

<!-- PRICE INTRO -->
<section class="sec sec--white">
  <div class="container container--narrow">
    <div class="price-intro rv">
      <p>当院では治療前に費用についてしっかりとご説明し、ご納得いただいた上で治療を開始いたします。<br>
      下記は自費診療の料金目安です。保険適用の治療は別途ご案内いたします。</p>
    </div>
  </div>
</section>

<?php
// ACF利用時: $categories = get_field('price_categories') ?: [];
$categories = [
  [
    'title' => '審美歯科',
    'en'    => 'Aesthetic',
    'items' => [
      ['name' => 'オールセラミック',       'price' => '¥80,000〜¥120,000', 'note' => '税込'],
      ['name' => 'ジルコニアセラミック',   'price' => '¥100,000〜¥150,000','note' => '税込'],
      ['name' => 'ラミネートベニア',       'price' => '¥80,000〜',         'note' => '税込 / 1本'],
      ['name' => 'ホワイトニング（オフィス）','price' => '¥30,000〜',      'note' => '税込'],
      ['name' => 'ホワイトニング（ホーム）', 'price' => '¥20,000〜',       'note' => '税込'],
    ],
  ],
  [
    'title' => 'インプラント',
    'en'    => 'Implant',
    'items' => [
      ['name' => 'インプラント（1本）',   'price' => '¥300,000〜¥400,000', 'note' => '税込 / 上部構造含む'],
      ['name' => 'ガイデッドサージェリー','price' => '¥50,000〜',           'note' => '税込'],
      ['name' => 'ソケットリフト',         'price' => '¥50,000〜',          'note' => '税込'],
    ],
  ],
  [
    'title' => '矯正歯科',
    'en'    => 'Orthodontics',
    'items' => [
      ['name' => 'ワイヤー矯正',     'price' => '¥600,000〜¥800,000', 'note' => '税込'],
      ['name' => 'マウスピース矯正', 'price' => '¥400,000〜¥800,000', 'note' => '税込'],
      ['name' => '部分矯正',         'price' => '¥200,000〜¥400,000', 'note' => '税込'],
      ['name' => '相談・検査',       'price' => '¥3,000〜',            'note' => '税込'],
    ],
  ],
];

$bg_toggle = true;
foreach ($categories as $cat) :
  $sec_class = $bg_toggle ? 'sec--sub' : 'sec--white';
  $bg_toggle = !$bg_toggle;
?>
  <section class="sec <?php echo $sec_class; ?>">
    <div class="container">
      <div class="sec-head rv">
        <p class="sec-head__label"><?php echo esc_html($cat['en']); ?></p>
        <h2 class="sec-head__title"><?php echo esc_html($cat['title']); ?></h2>
      </div>
      <div class="price-table-wrap rv">
        <table class="price-table">
          <thead>
            <tr>
              <th>治療内容</th>
              <th>料金（税込）</th>
              <th>備考</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($cat['items'] as $item) : ?>
              <tr>
                <td><?php echo esc_html($item['name']); ?></td>
                <td class="price-table__price"><?php echo esc_html($item['price']); ?></td>
                <td class="price-table__note"><?php echo esc_html($item['note']); ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
  </section>
<?php endforeach; ?>

<!-- NOTES -->
<section class="sec sec--white">
  <div class="container container--narrow">
    <div class="price-notes rv">
      <h3>お支払いについて</h3>
      <ul>
        <li>各種クレジットカードをご利用いただけます</li>
        <li>デンタルローン（分割払い）にも対応しております</li>
        <li>料金はあくまで目安です。症例によって異なる場合がございます</li>
        <li>詳しくはカウンセリング時にご説明いたします</li>
      </ul>
    </div>
  </div>
</section>

<?php get_footer(); ?>
