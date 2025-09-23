#!/bin/bash

# git-auto-commit - Automated git workflow with conventional commits
# Description: Groups modified/untracked files by type and commits automatically
# Usage: ./scripts/git-auto-commit.sh

set -e

echo "🔍 Starting automated git commit process..."

# Step 1: Check if project builds successfully
echo "📦 Checking project build..."
if ! pnpm build; then
    echo "❌ Build failed! Cannot commit changes."
    echo "Please fix build errors before committing."
    exit 1
fi

echo "✅ Build successful!"

# Step 2: Get list of modified/untracked files
echo "📋 Analyzing changes..."
MODIFIED_FILES=$(git status --porcelain)

if [ -z "$MODIFIED_FILES" ]; then
    echo "✅ No changes to commit."
    exit 0
fi

echo "Found changes:"
echo "$MODIFIED_FILES"

# Function to commit files with conventional commit message
commit_files() {
    local TYPE="$1"
    local DESCRIPTION="$2"
    shift 2
    local FILES=("$@")
    
    if [ ${#FILES[@]} -eq 0 ]; then
        return 0
    fi
    
    echo "📝 Committing $TYPE changes..."
    
    # Add files
    git add "${FILES[@]}"
    
    # Create commit message without any AI references
    local COMMIT_MSG="$TYPE: $DESCRIPTION"
    
    # Commit without Co-Authored-By or AI references
    git commit -m "$COMMIT_MSG"
    
    echo "✅ Committed $TYPE: $DESCRIPTION"
}

# Arrays to store files by type
declare -a FEAT_FILES=()
declare -a FIX_FILES=()
declare -a REFACTOR_FILES=()
declare -a STYLE_FILES=()
declare -a DOCS_FILES=()
declare -a TEST_FILES=()
declare -a CHORE_FILES=()

# Analyze each file and categorize
while IFS= read -r line; do
    if [ -z "$line" ]; then
        continue
    fi
    
    STATUS="${line:0:2}"
    FILE="${line:3}"
    
    # Skip if file doesn't exist and isn't a deletion
    if [[ ! "$STATUS" =~ D ]] && [[ ! -f "$FILE" ]]; then
        continue
    fi
    
    # Categorize files based on path and type
    case "$FILE" in
        # New features
        src/app/*/page.tsx|src/components/ui/*|src/hooks/*)
            if [[ "$STATUS" =~ A ]]; then
                FEAT_FILES+=("$FILE")
            else
                REFACTOR_FILES+=("$FILE")
            fi
            ;;
        
        # Bug fixes (look for "fix" in filename or path)
        *fix*|*bug*|*error*)
            FIX_FILES+=("$FILE")
            ;;
        
        # Documentation
        *.md|docs/*|README*)
            DOCS_FILES+=("$FILE")
            ;;
        
        # Tests
        *test*|*spec*|__tests__/*|*.test.*|*.spec.*)
            TEST_FILES+=("$FILE")
            ;;
        
        # Styles
        *.css|*.scss|*.sass|*.less|globals.css)
            STYLE_FILES+=("$FILE")
            ;;
        
        # Configuration/Infrastructure
        package.json|pnpm-lock.yaml|*.config.*|.env*|tsconfig.*|docker*|Dockerfile)
            CHORE_FILES+=("$FILE")
            ;;
        
        # Deletions and cleanup
        *)
            if [[ "$STATUS" =~ D ]] || [[ "$FILE" =~ " 2." ]] || [[ "$FILE" =~ temp ]] || [[ "$FILE" =~ tmp ]]; then
                CHORE_FILES+=("$FILE")
            elif [[ "$FILE" =~ src/app/api ]] || [[ "$FILE" =~ src/lib/services ]]; then
                REFACTOR_FILES+=("$FILE")
            elif [[ "$STATUS" =~ A ]]; then
                FEAT_FILES+=("$FILE")
            else
                REFACTOR_FILES+=("$FILE")
            fi
            ;;
    esac
done <<< "$MODIFIED_FILES"

# Commit each type of change
if [ ${#FEAT_FILES[@]} -gt 0 ]; then
    commit_files "feat" "add new features and components" "${FEAT_FILES[@]}"
fi

if [ ${#FIX_FILES[@]} -gt 0 ]; then
    commit_files "fix" "resolve bugs and issues" "${FIX_FILES[@]}"
fi

if [ ${#REFACTOR_FILES[@]} -gt 0 ]; then
    commit_files "refactor" "improve code structure and performance" "${REFACTOR_FILES[@]}"
fi

if [ ${#STYLE_FILES[@]} -gt 0 ]; then
    commit_files "style" "update styling and visual improvements" "${STYLE_FILES[@]}"
fi

if [ ${#DOCS_FILES[@]} -gt 0 ]; then
    commit_files "docs" "update documentation" "${DOCS_FILES[@]}"
fi

if [ ${#TEST_FILES[@]} -gt 0 ]; then
    commit_files "test" "add or update tests" "${TEST_FILES[@]}"
fi

if [ ${#CHORE_FILES[@]} -gt 0 ]; then
    commit_files "chore" "update dependencies and cleanup" "${CHORE_FILES[@]}"
fi

echo "🎉 All changes committed successfully!"
echo "⚠️  Remember: No automatic push performed."
echo "📤 Run 'git push' manually when ready to sync with remote."

# Show final status
echo ""
echo "📊 Final git status:"
git log --oneline -5