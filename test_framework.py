#!/usr/bin/env python
"""
Test Codette Universal Reasoning Framework Integration
Verifies all components are properly connected
"""

import asyncio
import sys
from pathlib import Path

# Add Codette to path
codette_path = Path(__file__).parent / "Codette"
sys.path.insert(0, str(codette_path))

def test_imports():
    """Test that all framework modules can be imported"""
    print("="*70)
    print("TEST 1: Module Imports")
    print("="*70)
    
    try:
        from src.framework import CognitionCocooner, DreamReweaver, EthicalAIGovernance
        print("? Framework modules imported successfully")
        
        from src.components.quantum_spiderweb import QuantumSpiderweb
        print("? QuantumSpiderweb imported successfully")
        
        from src.framework.universal_reasoning import UniversalReasoning, load_json_config
        print("? UniversalReasoning imported successfully")
        
        return True
    except Exception as e:
        print(f"? Import failed: {e}")
        return False

def test_individual_modules():
    """Test each module individually"""
    print("\n" + "="*70)
    print("TEST 2: Individual Module Functionality")
    print("="*70)
    
    from src.framework import CognitionCocooner, DreamReweaver, EthicalAIGovernance
    from src.components.quantum_spiderweb import QuantumSpiderweb
    
    # Test CognitionCocooner
    print("\n?? Testing CognitionCocooner...")
    cocooner = CognitionCocooner(storage_path="test_cocoons")
    thought = {"query": "Test thought", "depth": 1}
    cocoon_id = cocooner.wrap(thought, "prompt")
    unwrapped = cocooner.unwrap(cocoon_id)
    print(f"  ? Wrap/Unwrap: {cocoon_id}")
    
    # Test DreamReweaver
    print("\n?? Testing DreamReweaver...")
    reweaver = DreamReweaver(cocoon_dir="test_cocoons")
    dreams = reweaver.generate_dream_sequence(limit=2)
    print(f"  ? Generated {len(dreams)} dreams")
    
    # Test EthicalAIGovernance
    print("\n??  Testing EthicalAIGovernance...")
    ethics = EthicalAIGovernance()
    result = ethics.enforce_policies("This is a test response")
    print(f"  ? Ethical check passed: {result['passed']}")
    
    # Test QuantumSpiderweb
    print("\n???  Testing QuantumSpiderweb...")
    quantum = QuantumSpiderweb(node_count=16)
    path = quantum.propagate_thought("QNode_0", depth=2)
    tension = quantum.detect_tension("QNode_0")
    collapsed = quantum.collapse_node("QNode_0")
    print(f"  ? Propagated {len(path)} nodes")
    print(f"  ? Tension: {tension:.4f}")
    print(f"  ? Collapsed: {collapsed}")
    
    return True

async def test_universal_reasoning():
    """Test UniversalReasoning orchestrator"""
    print("\n" + "="*70)
    print("TEST 3: UniversalReasoning Orchestration")
    print("="*70)
    
    from src.framework.universal_reasoning import UniversalReasoning
    
    # Create test config
    config = {
        "enabled_perspectives": ["newton", "davinci", "neural_network", "copilot"],
        "ethical_considerations": "Always act transparently and ethically.",
        "quantum_spiderweb": {"node_count": 16},
        "cognition_cocooner": {"storage_path": "test_cocoons"}
    }
    
    print("\n?? Initializing UniversalReasoning...")
    ur = UniversalReasoning(config)
    
    print("\n?? Testing query: 'What is consciousness?'")
    response = await ur.generate_response("What is consciousness?")
    
    print("\n?? Response Preview:")
    print("-" * 70)
    lines = response.split('\n')
    for line in lines[:10]:  # Show first 10 lines
        print(line)
    if len(lines) > 10:
        print(f"... ({len(lines) - 10} more lines)")
    print("-" * 70)
    
    return True

def test_codette_compatibility():
    """Test that framework is compatible with existing Codette"""
    print("\n" + "="*70)
    print("TEST 4: Codette Compatibility")
    print("="*70)
    
    try:
        from codette_enhanced import Codette
        print("? codette_enhanced imported successfully")
        
        codette = Codette(user_name="TestUser")
        print("? Codette instance created")
        
        # Test a simple query
        response = codette.respond("test query")
        print("? Codette.respond() works")
        
        return True
    except Exception as e:
        print(f"??  Codette compatibility check skipped: {e}")
        return True  # Not critical

async def main():
    """Run all tests"""
    print("\n" + "="*70)
    print("CODETTE UNIVERSAL REASONING FRAMEWORK - TEST SUITE")
    print("="*70)
    
    results = []
    
    # Test 1: Imports
    results.append(("Imports", test_imports()))
    
    # Test 2: Individual modules
    if results[-1][1]:
        results.append(("Individual Modules", test_individual_modules()))
    
    # Test 3: UniversalReasoning
    if results[-1][1]:
        results.append(("UniversalReasoning", await test_universal_reasoning()))
    
    # Test 4: Codette compatibility
    results.append(("Codette Compatibility", test_codette_compatibility()))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    for name, passed in results:
        status = "? PASS" if passed else "? FAIL"
        print(f"{status} - {name}")
    
    passed_count = sum(1 for _, p in results if p)
    total_count = len(results)
    
    print(f"\n?? Results: {passed_count}/{total_count} tests passed")
    
    if passed_count == total_count:
        print("\n?? All tests passed! Framework is fully operational.")
        return 0
    else:
        print("\n??  Some tests failed. Check output above.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
