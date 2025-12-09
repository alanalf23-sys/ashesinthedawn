# Codette Response Enhancement Guide

## Current System Overview

Codette uses a **3-layer architecture** for intelligent DAW responses:

### Layer 1: codette_enhanced.py (Base - 9 Perspectives)
- Neural network perspective (pattern recognition)
- Copilot agent (step-by-step guidance)
- Newtonian logic (cause-effect)
- Mathematical rigor (technical specs)
- Da Vinci synthesis (creative ideas)
- Resilient kindness (supportive guidance)
- Quantum logic (multiple approaches)
- Philosophical inquiry (deeper questions)
- Symbolic reasoning (signal flow)

### Layer 2: codette_advanced.py (AI Enhancements)
- Sentiment analysis (VADER)
- Identity analysis
- Emotional adaptation
- Predictive analytics
- Holistic health monitoring
- Ethical enforcement
- Explainable AI

### Layer 3: codette_hybrid.py (Production Optimization)
- Defense modifiers (security, tone, length)
- Vector search (semantic similarity)
- Prompt engineering
- Optional ML features (transformers)
- Response caching

## How to Enhance Responses

### 1. Add New Perspective (codette_enhanced.py)

```python
def myNewPerspective(self, prompt: str, daw_context: Dict[str, Any] = None) -> str:
    """My new perspective - description"""
    is_daw = self._is_daw_query(prompt)
    context = self._get_daw_context(prompt)
    selected = daw_context.get("selected_track") if daw_context else None
    
    if is_daw:
        if selected:
            # Track-specific advice
            track_name = selected.get('name', 'your track')
            return f"**my_new_perspective**: [Analysis for '{track_name}'] ..."
        
        # Generic DAW advice
        if context["category"] == "eq":
            return "**my_new_perspective**: [EQ Advice] ..."
        
        return "**my_new_perspective**: [General Advice] ..."
    else:
        return "**my_new_perspective**: [Redirect] I specialize in DAW questions!"
```

Then add to the `modules` list in `respond()`:
```python
modules = [
    self.neuralNetworkPerspective,
    # ... existing perspectives ...
    self.myNewPerspective,  # ? Add here
]
```

### 2. Add Follow-Up Pattern

Edit `_is_followup_question()` in `codette_enhanced.py`:

```python
followup_patterns = [
    'what else',
    'anything else',
    # ... existing patterns ...
    'your new pattern',  # ? Add here
]
```

### 3. Add Training Data Category

Add to `codette_training_data.py`:

```python
MY_NEW_CATEGORY = {
    'subcategory1': {
        'data': 'value',
        'tips': ['tip1', 'tip2'],
    }
}

class CodetteTrainingData:
    def __init__(self):
        # ... existing categories ...
        self.my_new_category = MY_NEW_CATEGORY
```

Then use in perspectives:
```python
if self.training_data:
    data = self.training_data.my_new_category.get('subcategory1')
    # Use data for intelligent responses
```

### 4. Add Defense Modifier (codette_hybrid.py)

```python
def add_my_modifier(self):
    """Add my custom modifier"""
    def my_modifier(text: str) -> str:
        # Modify text
        return text
    
    self.response_modifiers.append(my_modifier)
```

Then initialize in `__init__`:
```python
self.defense_system.add_my_modifier()
```

## Response Quality Tips

### DO ?
- Use track-specific analysis when `selected_track` is available
- Check training data first for intelligent responses
- Vary perspectives between initial queries and follow-ups
- Keep responses focused (use top 3-4 perspectives)
- Use emoji sparingly for visual clarity (?? ? ?? ??)
- Format with markdown bold for perspective labels

### DON'T ?
- Repeat context intro on follow-up questions
- Use all 9 perspectives every time (too verbose)
- Engineer prompts for follow-up queries
- Add context to prompts before passing to underlying layers
- Break the `_is_followup_question()` detection

## Testing Your Changes

### Unit Test Template

```python
#!/usr/bin/env python
"""Test my new feature"""
import sys
sys.path.insert(0, 'Codette')

def test_my_feature():
    from codette_enhanced import Codette
    c = Codette()
    
    daw_ctx = {
        'selected_track': {'name': 'Test Track', 'type': 'audio', 'volume': -6.0},
        'track_counts': {'total': 1, 'audio': 1}
    }
    
    response = c.respond('test query', daw_ctx)
    
    # Assertions
    assert len(response) > 0
    assert 'my_new_perspective' in response
    
    print("? Test passed!")

if __name__ == '__main__':
    test_my_feature()
```

### Integration Test

```bash
# Test through all layers
python test_codette_full_stack.py

# Test specific layer
python -c "from codette_hybrid import CodetteHybrid; c = CodetteHybrid('Test'); print(c.respond('test query'))"
```

## Debugging Tips

### Enable Verbose Logging

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Check Layer Communication

```python
# In codette_hybrid.respond()
print(f"[HYBRID] Query: {filtered_query}")
print(f"[HYBRID] Is followup: {is_followup}")
print(f"[HYBRID] Response length: {len(response)}")
```

### Verify Parameter Passing

```python
# In codette_advanced.respond()
print(f"[ADVANCED] Query: {query}")
print(f"[ADVANCED] DAW context: {daw_context is not None}")
```

### Check Follow-Up Detection

```python
# In codette_enhanced.respond()
print(f"[ENHANCED] Is followup: {is_followup}")
print(f"[ENHANCED] Context intro: {bool(context_intro)}")
```

## Performance Optimization

### Memory Management
```python
# In codette_hybrid
def optimize_for_production(self):
    # Trim context memory
    if len(self.context_memory) > 100:
        self.context_memory = self.context_memory[-50:]
```

### Response Caching
```python
# Cache expensive operations
@lru_cache(maxsize=128)
def expensive_analysis(self, query: str) -> str:
    # ... analysis code ...
    pass
```

### Lazy Loading
```python
# Load training data only when needed
@property
def training_data(self):
    if not hasattr(self, '_training_data'):
        from codette_training_data import CodetteTrainingData
        self._training_data = CodetteTrainingData()
    return self._training_data
```

## Common Patterns

### Track Type Detection
```python
track_name_lower = track_name.lower()
if 'vocal' in track_name_lower:
    # Vocal processing
elif 'drum' in track_name_lower or 'kick' in track_name_lower:
    # Drum processing
elif 'bass' in track_name_lower:
    # Bass processing
```

### Context-Aware Suggestions
```python
if selected:
    volume = selected.get('volume', 0)
    if volume > -3:
        suggestions.append("? Reduce level to prevent clipping")
    elif volume < -18:
        suggestions.append("? Increase level - track is quiet")
```

### Progressive Enhancement
```python
# Try training data first
if self.training_data:
    info = self.instruments_db.get('vocals', {}).get('lead_vocals', {})
    return f"Advanced advice using training data: {info}"
else:
    # Fallback to basic advice
    return "Basic advice without training data"
```

## Future Enhancements

### Ideas for Improvement
1. **Context Memory**: Remember previous conversation context across sessions
2. **User Preferences**: Learn user's mixing style over time
3. **Project Analysis**: Analyze entire project structure for global suggestions
4. **Genre Detection**: Auto-detect genre and adjust advice accordingly
5. **Reference Matching**: Compare user's mix to professional references
6. **A/B Testing**: Suggest A/B comparisons for decision-making
7. **Workflow Automation**: Suggest complete signal chain setups
8. **Plugin Presets**: Recommend specific plugin settings
9. **Mastering Preparation**: Pre-mastering checklist and analysis
10. **Collaboration Tips**: Multi-user project guidance

### Architecture Improvements
1. **Microservices**: Split perspectives into separate services
2. **Real-time Updates**: WebSocket-based streaming responses
3. **Vector Database**: Store response embeddings for similarity search
4. **LLM Integration**: Add GPT/Claude for enhanced natural language
5. **Plugin Analysis**: Direct VST/AU parameter reading and suggestions

## Resources

- **Test Scripts**: `test_codette_*.py` files
- **Training Data**: `codette_training_data.py`
- **Server Integration**: `codette_server_unified.py`
- **Frontend Bridge**: `src/lib/codetteBridge.ts`
- **Documentation**: `CODETTE_FOLLOWUP_FIX_SUMMARY.md`

---

**Last Updated**: December 5, 2025
**Status**: Production Ready ?
**Next Review**: When adding new features
