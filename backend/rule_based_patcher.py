"""Rule-based error detection and patching system"""
import re
import ast
from typing import Optional, Tuple, List
from .models import ErrorType, Patch, PatchSource
import uuid
import difflib


class RuleBasedPatcher:
    """Applies rule-based fixes for common Python errors"""
    
    def __init__(self):
        self.rules = [
            self._fix_syntax_errors,
            self._fix_import_errors,
            self._fix_name_errors,
            self._fix_indentation,
            self._fix_missing_colons,
            self._fix_print_syntax,
            self._fix_common_typos,
            self._fix_zero_division,
            self._fix_type_errors,
            self._fix_index_errors,
            self._fix_value_errors,
            self._fix_recursion_errors,
            self._fix_attribute_errors,
            self._fix_key_errors,
        ]
    
    def can_fix(self, error_message: str, code: str) -> bool:
        """Check if this error can be fixed by rules"""
        fixable_patterns = [
            # Syntax errors
            r"SyntaxError",
            r"IndentationError",
            r"invalid syntax",
            r"expected ':'",
            # Name errors
            r"NameError: name '.*' is not defined",
            r"ModuleNotFoundError",
            r"ImportError",
            # Type errors
            r"TypeError: unsupported operand",
            r"TypeError: .* takes .* positional argument",
            r"TypeError: can only concatenate",
            # Index errors
            r"IndexError: list index out of range",
            r"IndexError: string index out of range",
            # Value errors
            r"ValueError: invalid literal",
            r"ValueError: could not convert",
            # Runtime errors
            r"ZeroDivisionError",
            r"AttributeError: .* has no attribute",
            r"KeyError:",
            # Recursion errors
            r"RecursionError: maximum recursion depth",
        ]
        return any(re.search(pattern, error_message) for pattern in fixable_patterns)
    
    def generate_patch(self, error_message: str, code: str, version: int) -> Optional[Patch]:
        """Try to generate a patch using rule-based fixes"""
        # Extract error category from error message
        error_category = "unknown"
        if "SyntaxError" in error_message or "IndentationError" in error_message:
            error_category = "syntax"
        elif "NameError" in error_message or "ImportError" in error_message:
            error_category = "name"
        elif "TypeError" in error_message:
            error_category = "type"
        elif "IndexError" in error_message:
            error_category = "index"
        elif "ValueError" in error_message:
            error_category = "value"
        elif "RecursionError" in error_message:
            error_category = "recursion"
        elif "ZeroDivisionError" in error_message or "AttributeError" in error_message or "KeyError" in error_message:
            error_category = "runtime"
        
        for rule in self.rules:
            fixed_code, reasoning = rule(error_message, code)
            if fixed_code and fixed_code != code:
                diff = self._generate_diff(code, fixed_code)
                patch = Patch(
                    patch_id=str(uuid.uuid4()),
                    version_from=version,
                    version_to=version + 1,
                    source=PatchSource.RULE_BASED,
                    reasoning=reasoning,
                    diff=diff,
                    applied=False,
                    error_analysis=f"Rule-based analysis: {error_message[:200]}",
                    fix_strategy=reasoning,
                    error_category=error_category
                )
        return None
    
    def _generate_diff(self, original: str, modified: str) -> str:
        """Generate unified diff between two code versions"""
        diff = difflib.unified_diff(
            original.splitlines(keepends=True),
            modified.splitlines(keepends=True),
            fromfile='original',
            tofile='modified',
            lineterm=''
        )
        return ''.join(diff)
    
    def _fix_syntax_errors(self, error_message: str, code: str) -> Tuple[Optional[str], str]:
        """Fix common syntax errors"""
        # Fix missing parentheses in print (Python 2 to 3)
        if "SyntaxError" in error_message and "print" in code:
            return self._fix_print_syntax(error_message, code)
        return None, ""
    
    def _fix_print_syntax(self, error_message: str, code: str) -> Tuple[Optional[str], str]:
        """Convert Python 2 print statements to Python 3"""
        pattern = r'\bprint\s+([^(].*?)(?=\n|$)'
        if re.search(pattern, code):
            fixed = re.sub(pattern, r'print(\1)', code)
            return fixed, "Fixed print statement syntax: converted Python 2 style to Python 3 function call"
        return None, ""
    
    def _fix_import_errors(self, error_message: str, code: str) -> Tuple[Optional[str], str]:
        """Fix common import errors"""
        # Extract missing module name
        match = re.search(r"No module named '(.*?)'", error_message)
        if match:
            module = match.group(1)
            # Common module name typos
            corrections = {
                'np': 'numpy',
                'pd': 'pandas',
                'plt': 'matplotlib.pyplot',
            }
            if module in corrections:
                fixed = re.sub(
                    rf'\bimport {module}\b',
                    f'import {corrections[module]} as {module}',
                    code
                )
                return fixed, f"Fixed import: changed '{module}' to '{corrections[module]} as {module}'"
        return None, ""
    
    def _fix_name_errors(self, error_message: str, code: str) -> Tuple[Optional[str], str]:
        """Fix common name errors"""
        match = re.search(r"name '(.*?)' is not defined", error_message)
        if match:
            undefined_name = match.group(1)
            
            # Check for common typos
            typo_map = {
                'ture': 'True',
                'fasle': 'False',
                'Ture': 'True',
                'Flase': 'False',
                'none': 'None',
            }
            
            if undefined_name in typo_map:
                fixed = re.sub(rf'\b{undefined_name}\b', typo_map[undefined_name], code)
                return fixed, f"Fixed typo: changed '{undefined_name}' to '{typo_map[undefined_name]}'"
        
        return None, ""
    
    def _fix_indentation(self, error_message: str, code: str) -> Tuple[Optional[str], str]:
        """Fix indentation errors"""
        if "IndentationError" in error_message or "expected an indented block" in error_message:
            lines = code.split('\n')
            fixed_lines = []
            needs_indent = False
            
            for i, line in enumerate(lines):
                stripped = line.lstrip()
                if stripped.endswith(':'):
                    needs_indent = True
                    fixed_lines.append(line)
                elif needs_indent and stripped and not line.startswith((' ', '\t')):
                    # Add indentation
                    fixed_lines.append('    ' + line)
                    needs_indent = False
                else:
                    fixed_lines.append(line)
                    if stripped:
                        needs_indent = False
            
            fixed = '\n'.join(fixed_lines)
            if fixed != code:
                return fixed, "Fixed indentation: added missing indentation after colon"
        
        return None, ""
    
    def _fix_missing_colons(self, error_message: str, code: str) -> Tuple[Optional[str], str]:
        """Fix missing colons after if, for, while, def, class"""
        if "invalid syntax" in error_message or "expected ':'" in error_message:
            # Match lines that should end with colon but don't
            patterns = [
                (r'^(\s*)(if .+[^:])$', r'\1\2:'),
                (r'^(\s*)(elif .+[^:])$', r'\1\2:'),
                (r'^(\s*)(else[^:])$', r'\1\2:'),
                (r'^(\s*)(for .+[^:])$', r'\1\2:'),
                (r'^(\s*)(while .+[^:])$', r'\1\2:'),
                (r'^(\s*)(def .+\)[^:])$', r'\1\2:'),
                (r'^(\s*)(class .+[^:])$', r'\1\2:'),
            ]
            
            lines = code.split('\n')
            fixed_lines = []
            fixed = False
            
            for line in lines:
                new_line = line
                for pattern, replacement in patterns:
                    if re.match(pattern, line):
                        new_line = re.sub(pattern, replacement, line, flags=re.MULTILINE)
                        if new_line != line:
                            fixed = True
                        break
                fixed_lines.append(new_line)
            
            if fixed:
                return '\n'.join(fixed_lines), "Fixed missing colons: added colons after control flow statements"
        
        return None, ""
    
    def _fix_common_typos(self, error_message: str, code: str) -> Tuple[Optional[str], str]:
        """Fix common typos in code"""
        typos = {
            r'\bpirnt\b': 'print',
            r'\bimprot\b': 'import',
            r'\bretrun\b': 'return',
            r'\bdeifne\b': 'define',
        }
        
        fixed = code
        changes = []
        for typo, correction in typos.items():
            if re.search(typo, fixed):
                fixed = re.sub(typo, correction, fixed)
                changes.append(f"'{typo}' → '{correction}'")
        
        if changes:
            return fixed, f"Fixed typos: {', '.join(changes)}"
        
        return None, ""
    
    def _fix_zero_division(self, code: str, error_msg: str) -> Tuple[Optional[str], str]:
        """Fix ZeroDivisionError by adding a check before division"""
        if "ZeroDivisionError" not in error_msg:
            return None, ""
        
        lines = code.split('\n')
        fixed_lines = []
        
        # Pattern to detect division operations
        division_pattern = r'(\w+)\s*/\s*(\w+)'
        
        for line in lines:
            # Check if this line contains a division
            if '/' in line and '//' not in line:  # Exclude floor division
                match = re.search(division_pattern, line)
                if match:
                    # Extract the divisor variable
                    divisor = match.group(2)
                    indent = len(line) - len(line.lstrip())
                    
                    # Add check before the operation
                    fixed_lines.append(' ' * indent + f'if {divisor} == 0:')
                    fixed_lines.append(' ' * (indent + 4) + f'raise ValueError("Cannot divide by zero")')
                    fixed_lines.append(line)
                else:
                    fixed_lines.append(line)
            else:
                fixed_lines.append(line)
        
        fixed = '\n'.join(fixed_lines)
        if fixed != code:
            return fixed, "Added zero division check"
        
        return None, ""
    
    def _fix_type_errors(self, error_message: str, code: str) -> Tuple[Optional[str], str]:
        """Fix common type errors"""
        if "TypeError" not in error_message:
            return None, ""
        
        # Fix string + int concatenation
        if "can only concatenate str" in error_message:
            # Find patterns like: "text" + number
            pattern = r'(["\'][^"\']*["\'])\s*\+\s*(\w+)'
            if re.search(pattern, code):
                fixed = re.sub(pattern, r'\1 + str(\2)', code)
                return fixed, "Fixed type error: wrapped integer in str() for string concatenation"
        
        # Fix list/string operations
        if "unsupported operand" in error_message:
            # Common: multiplying list by float
            pattern = r'(\w+)\s*\*\s*(\d+\.\d+)'
            if re.search(pattern, code):
                fixed = re.sub(pattern, r'\1 * int(\2)', code)
                return fixed, "Fixed type error: converted float to int for sequence multiplication"
        
        return None, ""
    
    def _fix_index_errors(self, error_message: str, code: str) -> Tuple[Optional[str], str]:
        """Fix common index out of range errors"""
        if "IndexError" not in error_message:
            return None, ""
        
        lines = code.split('\n')
        fixed_lines = []
        
        # Pattern to detect array indexing
        index_pattern = r'(\w+)\[(\w+)\]'
        
        for line in lines:
            if '[' in line and ']' in line:
                match = re.search(index_pattern, line)
                if match:
                    array_name = match.group(1)
                    index_var = match.group(2)
                    indent = len(line) - len(line.lstrip())
                    
                    # Add bounds check
                    fixed_lines.append(' ' * indent + f'if {index_var} < len({array_name}):')
                    fixed_lines.append(' ' * (indent + 4) + line.lstrip())
                    fixed_lines.append(' ' * indent + 'else:')
                    fixed_lines.append(' ' * (indent + 4) + f'print("Index out of range: {{0}}".format({index_var}))')
                else:
                    fixed_lines.append(line)
            else:
                fixed_lines.append(line)
        
        fixed = '\n'.join(fixed_lines)
        if fixed != code:
            return fixed, "Fixed index error: added bounds checking before array access"
        
        return None, ""
    
    def _fix_value_errors(self, error_message: str, code: str) -> Tuple[Optional[str], str]:
        """Fix common value errors"""
        if "ValueError" not in error_message:
            return None, ""
        
        # Fix invalid literal for int()
        if "invalid literal for int()" in error_message:
            # Wrap int() calls in try-except
            pattern = r'int\(([^)]+)\)'
            if re.search(pattern, code):
                lines = code.split('\n')
                fixed_lines = []
                
                for line in lines:
                    if 'int(' in line and 'try:' not in line:
                        indent = len(line) - len(line.lstrip())
                        fixed_lines.append(' ' * indent + 'try:')
                        fixed_lines.append(' ' * (indent + 4) + line.lstrip())
                        fixed_lines.append(' ' * indent + 'except ValueError:')
                        fixed_lines.append(' ' * (indent + 4) + 'print("Invalid input: cannot convert to integer")')
                    else:
                        fixed_lines.append(line)
                
                return '\n'.join(fixed_lines), "Fixed value error: added try-except around int() conversion"
        
        return None, ""
    
    def _fix_recursion_errors(self, error_message: str, code: str) -> Tuple[Optional[str], str]:
        """Fix recursion errors by adding base cases"""
        if "RecursionError" not in error_message:
            return None, ""
        
        lines = code.split('\n')
        fixed_lines = []
        
        # Find recursive function definitions
        func_pattern = r'^(\s*)def (\w+)\(([^)]*)\):'
        
        for i, line in enumerate(lines):
            match = re.match(func_pattern, line)
            if match:
                indent = match.group(1)
                func_name = match.group(2)
                params = match.group(3)
                
                # Add the function definition
                fixed_lines.append(line)
                
                # Check if next line has a base case
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    if not next_line.startswith('if'):
                        # Add a basic base case
                        param_list = [p.strip().split('=')[0].strip() for p in params.split(',') if p.strip()]
                        if param_list:
                            first_param = param_list[0]
                            fixed_lines.append(indent + '    ' + f'if {first_param} <= 0 or {first_param} is None:')
                            fixed_lines.append(indent + '    ' + '    return None  # Base case')
            else:
                fixed_lines.append(line)
        
        fixed = '\n'.join(fixed_lines)
        if fixed != code:
            return fixed, "Fixed recursion error: added missing base case to prevent infinite recursion"
        
        return None, ""
    
    def _fix_attribute_errors(self, error_message: str, code: str) -> Tuple[Optional[str], str]:
        """Fix common attribute errors"""
        if "AttributeError" not in error_message:
            return None, ""
        
        # Extract the attribute that doesn't exist
        match = re.search(r"has no attribute '(.*?)'", error_message)
        if match:
            missing_attr = match.group(1)
            
            # Common typos
            corrections = {
                'append': 'append',  # Already correct, but checking for list vs tuple
                'len': '__len__',
                'size': '__len__',
            }
            
            # Check if trying to append to tuple (common mistake)
            if missing_attr == 'append' and "'tuple' object" in error_message:
                # Find tuple definitions and convert to list
                pattern = r'(\w+)\s*=\s*\(([^)]*)\)'
                if re.search(pattern, code):
                    fixed = re.sub(pattern, r'\1 = [\2]', code)
                    return fixed, "Fixed attribute error: converted tuple to list to support append()"
        
        return None, ""
    
    def _fix_key_errors(self, error_message: str, code: str) -> Tuple[Optional[str], str]:
        """Fix common key errors in dictionaries"""
        if "KeyError" not in error_message:
            return None, ""
        
        # Extract the missing key
        match = re.search(r"KeyError: ['\"]([^'\"]*)['\"]|", error_message)
        if match:
            lines = code.split('\n')
            fixed_lines = []
            
            # Find dictionary access and add .get() or check
            dict_access_pattern = r'(\w+)\[(["\'][^"\']["\'])\]'
            
            for line in lines:
                if '[' in line and ']' in line and 'get(' not in line:
                    # Replace dict[key] with dict.get(key, default)
                    fixed_line = re.sub(dict_access_pattern, r'\1.get(\2, None)', line)
                    if fixed_line != line:
                        fixed_lines.append(fixed_line)
                    else:
                        fixed_lines.append(line)
                else:
                    fixed_lines.append(line)
            
            fixed = '\n'.join(fixed_lines)
            if fixed != code:
                return fixed, "Fixed key error: replaced dict[key] with dict.get(key, None) for safe access"
        
        return None, ""
    
    def validate_syntax(self, code: str) -> Tuple[bool, Optional[str]]:
        """Validate Python syntax"""
        try:
            ast.parse(code)
            return True, None
        except SyntaxError as e:
            return False, str(e)
