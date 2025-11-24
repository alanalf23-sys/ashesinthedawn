#!/usr/bin/env python3
"""
Theme verification and testing script for Codette Quantum DAW
Tests all 6 available themes for completeness and renders a sample
"""

from codette_gui.themes import ThemeManager


def main():
    """Run theme verification tests"""
    tm = ThemeManager()

    print("\n" + "="*60)
    print("CODETTE QUANTUM DAW - THEME VERIFICATION")
    print("="*60)

    # 1. List all available themes
    print("\n✓ Available Themes:")
    for i, theme_name in enumerate(tm.get_available_themes(), 1):
        marker = "→" if theme_name == tm.current else " "
        print(f"  {marker} {i}. {theme_name}")

    # 2. Verify all themes
    print("\n✓ Theme Validation:")
    results = tm.verify_all_themes()
    all_valid = True
    for result in results:
        status = "✓ VALID" if result["valid"] else "✗ INVALID"
        print(f"  {status:10} : {result['theme']}")
        if not result["valid"]:
            print(f"             Error: {result.get('error', 'Unknown error')}")
            all_valid = False

    # 3. Print color palettes for all themes
    print("\n✓ Color Palettes:")
    for theme_name in tm.get_available_themes():
        tm.print_theme_palette(theme_name)

    # 4. Test theme switching
    print("✓ Testing Theme Switching:")
    original = tm.current
    for theme_name in tm.get_available_themes():
        success = tm.set_theme(theme_name)
        print(f"  Set to {theme_name:12} : {'✓ Success' if success else '✗ Failed'}")
    tm.set_theme(original)
    print(f"  Restored to {original}")

    # 5. Summary
    print("\n" + "="*60)
    if all_valid:
        print("✓ ALL THEMES VALID - Ready for production")
    else:
        print("✗ THEME VALIDATION FAILED - Check errors above")
    print("="*60 + "\n")

    return 0 if all_valid else 1


if __name__ == "__main__":
    exit(main())
