<?php
/**
 * Plugin Name: Ritmo de guitarra
 * Description: Metrónomo visual con subdivisiones para practicar guitarra. Usa el shortcode [ritmo_guitarra].
 * Version: 1.0.0
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: Ritmo de guitarra
 * License: GPL-2.0-or-later
 */

if (!defined('ABSPATH')) {
    exit;
}

function rguitar_register_assets() {
    $base = plugin_dir_url(__FILE__);
    wp_register_style('ritmo-guitarra', $base . 'ritmo-guitarra.css', array(), '1.0.0');
    wp_register_script('ritmo-guitarra', $base . 'ritmo-guitarra.js', array(), '1.0.0', true);
}
add_action('wp_enqueue_scripts', 'rguitar_register_assets');

function rguitar_shortcode() {
    wp_enqueue_style('ritmo-guitarra');
    wp_enqueue_script('ritmo-guitarra');

    ob_start();
    ?>
    <section class="rguitar" data-rguitar aria-label="Práctica de ritmo">
        <header class="rguitar__header">
            <div>
                <p class="rguitar__eyebrow">ENTRENAMIENTO RÍTMICO</p>
                <h2 class="rguitar__title">Ritmo de guitarra</h2>
                <p class="rguitar__intro">Sigue el pulso, escucha el acento y toca cada subdivisión.</p>
            </div>
            <div class="rguitar__status" data-status role="status" aria-live="polite">Listo para practicar</div>
        </header>

        <div class="rguitar__settings">
            <label class="rguitar__field rguitar__bpm-field">
                <span class="rguitar__label">Velocidad</span>
                <span class="rguitar__bpm-row"><input data-bpm type="number" min="30" max="240" step="1" value="90" inputmode="numeric" aria-label="Pulsos por minuto"><span>BPM</span></span>
                <input data-bpm-range class="rguitar__range" type="range" min="30" max="240" value="90" aria-label="Ajustar velocidad">
            </label>
            <label class="rguitar__field">
                <span class="rguitar__label">Compás</span>
                <select data-meter>
                    <option value="4">4/4</option><option value="3">3/4</option><option value="2">2/4</option><option value="6">6/8</option>
                </select>
            </label>
            <label class="rguitar__field">
                <span class="rguitar__label">Pulso equivale a</span>
                <select data-beat-unit>
                    <option value="quarter" selected>Negra</option><option value="dotted">Negra con puntillo</option>
                </select>
            </label>
            <label class="rguitar__field">
                <span class="rguitar__label">Subdivisión</span>
                <select data-subdivision>
                    <option value="1">Negras</option><option value="2" selected>Corcheas</option><option value="3">Tresillos</option><option value="4">Semicorcheas</option>
                </select>
            </label>
        </div>

        <div class="rguitar__practice">
            <div class="rguitar__measure-line">
                <span class="rguitar__label">UN COMPÁS</span>
                <span data-grid-caption class="rguitar__grid-caption">4 pulsos · 8 pasos</span>
            </div>
            <div class="rguitar__grid" data-grid role="img" aria-label="Guía visual del compás"></div>
            <div class="rguitar__legend"><span><i class="rguitar__legend-dot rguitar__legend-dot--strong"></i>Pulso fuerte</span><span><i class="rguitar__legend-dot"></i>Subdivisión</span></div>
        </div>

        <footer class="rguitar__footer">
            <p class="rguitar__hint">Ponte cómodo y toca una nota por cada punto iluminado.</p>
            <button class="rguitar__button" data-toggle type="button"><span data-button-icon aria-hidden="true">▶</span><span data-button-text>Empezar</span></button>
        </footer>
    </section>
    <?php
    return ob_get_clean();
}
add_shortcode('ritmo_guitarra', 'rguitar_shortcode');

